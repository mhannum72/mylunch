#include <stdio.h>
#include <pthread.h>
#include <string.h>
#include <stdlib.h>
#include <stddef.h>
#include <errno.h>
#include <inttypes.h>
#include <sys/ipc.h>
#include <sys/shm.h>
#include <alloca.h>
#include "base64.h"

/* This is written in C because it will be linked into nginx as well as node.js.  
 * I can write and use very simple glue-functions within my node funtion.  I'll
 * be a little object-oriented-y and allow folks to declare a 'sessionhash' 
 * type (given a key).  Maybe the 'sessionhash_open' call will take a shmkey as
 * it's argument, and return a structure to it. 
 *
 * I can do the read locklessly: a hash miss just goes to the next bucket by 
 * adding 'hash-step' (some number which is relatively prime to the size).  
 * Until I get to an empty bucket, or until I've searched the entire table.
 *
 * I will assume that there are multiple writers, and that they should lock.
 * Once a session is written, it will not go away until a reboot.
 */

#define MAGIC 0x5e551024

/* This is the handle returned to the user */
typedef struct sessionhash
{
    int             shmkey;
    int             shmid;
    uint64_t        nreads;
    uint64_t        nwrites;
    void            *sdata;
}
shash_t;

#define _SESSIONHASH_INTERNAL
#include "sessionhash.h"

enum sh_flags
{
    ELEMENT_IN_USE  = 0x00000001
};

/* Maps sessionid to userid */
typedef struct sesssionhash_element
{
    unsigned int            flags;
    long long               userid;
    char                    sessionid[1];
}
sh_element_t;

/* This structure is in shared memory */
typedef struct sessionhash_shared
{
    /* Make sure this is sane */
    int                     magic;

    /* Define meta-informaion */
    int                     headersize;
    int                     stepsize;
    int                     keysize;
    int                     elementsize;
    int                     maxelements;
    int                     numelements;
    pthread_mutex_t         lock;

    /* Lockless stats */
    uint64_t                nreads;
    uint64_t                nwrites;
    uint64_t                wcoll;
    uint64_t                nhits;
    uint64_t                nmisses;
    uint64_t                maxsteps;

    /* Histogram */
    uint64_t                steps[10];

    /* Hash */
    char                    element[1];
}
sh_shared_t;


/* Hash function */
static inline uint32_t hash_djb(const char *value, int len)
{
    uint32_t                hash = 5381;
    uint32_t                i;

    for(i = 0; i < len; value++, i++)
        hash = ((hash << 5) + hash) + (*value);

    return hash;
}

/* Decode function */
static inline uint32_t s_hash(const char *sessionid, int sz)
{
    int                     bsize;
    uint32_t                hval;
    char                    *bdata;

    /* Decode this */
    bdata = base64_decode(sessionid, sz, &bsize);

    /* Use djb hash */
    hval = hash_djb(bdata, bsize);

    /* Free */
    free(bdata);

    /* Return */
    return hval;
}

static shash_t *allocate_shash(int shmid, int shmkey, sh_shared_t *shared)
{
    shash_t                 *shash;

    /* Allocate from heap */
    shash = (shash_t *)calloc(sizeof(*shash), 1);

    /* Set internals */
    shash->shmid = shmid;
    shash->shmkey = shmkey;
    shash->sdata = shared;

    /* Return */
    return shash;
}

/* Create a sessionhash */
shash_t *sessionhash_create(int shmkey, int keysz, int nelements)
{
    int                     shmid;
    shash_t                 *shash;
    sh_shared_t             *shared;
    pthread_mutexattr_t     attr;
    size_t                  sz;
    size_t                  elsz;

    /* Calculate size of element */
    elsz = offsetof(sh_element_t, sessionid) + keysz;

    /* Calculate size */
    sz = offsetof(sh_shared_t, element) + (nelements * elsz);

    /* Get shmid for this segment */
    shmid = shmget(shmkey, sz, IPC_CREAT|IPC_EXCL|0666);

    /* Check for error */
    if(-1 == shmid)
    {
        fprintf(stderr, "%s error creating segment: %s.\n", __func__, 
                strerror(errno));
        return NULL;
    }

    /* Attach to memory */
    shared = (sh_shared_t *)shmat(shmid, NULL, 0);

    /* Make sure this succeeded */
    if(-1 == (int) shared)
    {
        fprintf(stderr, "%s error attaching to segment shmid %d: %s.\n", 
                __func__, shmid, strerror(errno));
        return NULL;
    }

    /* Zero segment */
    bzero(shared, sz);

    /* Magic */
    shared->magic = MAGIC;

    /* Setup */
    shared->headersize = offsetof(sh_shared_t, element);
    shared->stepsize = 1;
    shared->keysize = keysz;
    shared->elementsize = elsz;
    shared->maxelements = nelements;
    shared->numelements = 0;

    /* Create shared mutex */
    pthread_mutexattr_init(&attr);
    pthread_mutexattr_setpshared(&attr, PTHREAD_PROCESS_SHARED);
    pthread_mutex_init(&shared->lock, &attr);

    /* Allocate handle from heap */
    shash = allocate_shash(shmid, shmkey, shared);

    /* Return session hash */
    return shash;
}

/* Attach to an existing sessionhash */
shash_t *sessionhash_attach_int(int shmkey, int readonly)
{
    int                     shmid;
    shash_t                 *shash;
    sh_shared_t             *shared;
    int                     flags = readonly ? SHM_RDONLY : 0;

    /* Grab shmid */
    shmid = shmget(shmkey, 0, 0);

    if(-1 == shmid)
    {
        fprintf(stderr, "%s error getting shmid: %s.\n", __func__,
                strerror(errno));
        return NULL;
    }

    /* Attach to shmid */
    shared = (sh_shared_t *)shmat(shmid, NULL, flags);

    /* Make sure this was successful */
    if(-1 == (int) shared)
    {
        fprintf(stderr, "%s error attaching to segment shmid %d: %s.\n",
                __func__, shmid, strerror(errno));
        return NULL;
    }

    /* Verify magic */
    if(shared->magic != MAGIC)
    {
        shmdt(shared);
        fprintf(stderr, "%s magic mismatch, bad shared memory segment.\n", 
                __func__);
        return NULL;
    }

    /* Allocate memory for header */
    shash = allocate_shash(shmid, shmkey, shared);

    /* Return */
    return shash;
}

/* Attach read-write to a sessionhash */
shash_t *sessionhash_attach(int shmkey)
{
    return sessionhash_attach_int(shmkey, 0);
}

/* Attach readonly to a sessionhash */
shash_t *sessionhash_attach_readonly(int shmkey)
{
    return sessionhash_attach_int(shmkey, 1);
}

/* Destroy a sessionhash handle */
void sessionhash_destroy(shash_t *shash)
{
    free(shash);
}

/* Given an index return an sh_element_t */
static inline sh_element_t *findelement(shash_t *shash, int idx)
{
    sh_shared_t             *shared;
    char                    *ptr;

    /* Shared */
    shared = (sh_shared_t *)shash->sdata;

    /* Beginning of data */
    ptr = (char *)shared + shared->headersize;

    /* Correct offset */
    ptr += (idx * shared->elementsize);

    /* Cast offset to sh_element_t */
    return (sh_element_t *)ptr;
}

/* Find this session and return the user */
long long sessionhash_find(shash_t *shash, const char *insessionid)
{
    char                    *sessionid;
    uint32_t                hidx;
    sh_shared_t             *shared;
    sh_element_t            *element;
    long long               rtn = -1;
    int                     cnt = 0;
    int                     cmp = 1;
    int                     ln;
    int                     histcnt;

    /* Shared */
    shared = (sh_shared_t *)shash->sdata;

    /* Check argument size */
    if((ln = strlen(insessionid)) > shared->keysize)
        return -1;

    /* Copy and pad smaller keys */
    if(ln < shared->keysize)
    {
        sessionid = (char *)alloca(shared->keysize);
        memcpy(sessionid, insessionid, ln);
        bzero(&sessionid[ln], shared->keysize - ln);
    }
    else
        sessionid = (char *)insessionid;

    /* Hash index */
    hidx = s_hash(sessionid, strlen(sessionid)) % shared->maxelements;

    /* Element */
    element = findelement(shash, hidx);

    /* Iterate until match or miss */
    while(  (element->flags & ELEMENT_IN_USE) && 
            (cmp = memcmp(sessionid, element->sessionid, shared->keysize)) &&
            (++cnt < shared->maxelements))
    {
        hidx = (hidx + shared->stepsize) % shared->maxelements;
        element = findelement(shash, hidx);
    }

    /* Update stats */
    shared->nreads++;

    /* Copy out user id if this is a hit */
    if(!cmp)
    {
        /* Copy out userid */
        memcpy(&rtn, &element->userid, sizeof(element->userid));

        /* Update hits */
        shared->nhits++;
    }
    else
        /* Update misses */
        shared->nmisses++;

    /* Update max steps */
    if(cnt > shared->maxsteps)
        shared->maxsteps = cnt;

    /* Count elements */
    histcnt = sizeof(shared->steps) / sizeof(shared->steps[0]);

    /* Cap at last */
    if(cnt >= histcnt)
        cnt = histcnt - 1;

    /* Update shared */
    shared->steps[cnt]++;

    /* Return value */
    return rtn;
}

/* Add this key->userid mapping to sessionhash */
int sessionhash_add(shash_t *shash, const char *insessionid, long long userid)
{
    char                    *sessionid;
    uint32_t                hidx;
    sh_shared_t             *shared;
    sh_element_t            *element;
    long long               rtn = -1;
    int                     cnt = 0;
    int                     cmp = 1;
    int                     ln;

    /* Shared */
    shared = (sh_shared_t *)shash->sdata;

    /* Check length */
    if((ln = strlen(insessionid)) > shared->elementsize)
        return -1;

    /* Copy and pad smaller keys */
    if(ln < shared->keysize)
    {
        sessionid = (char *)alloca(shared->keysize);
        memcpy(sessionid, insessionid, ln);
        bzero(&sessionid[ln], shared->keysize - ln);
    }
    else
        sessionid = (char *)insessionid;

    /* Hash index */
    hidx = s_hash(sessionid, strlen(sessionid)) % shared->maxelements;

    /* Element */
    element = findelement(shash, hidx);

    /* Iterate until match or miss */
    while(  (element->flags & ELEMENT_IN_USE) && 
            (cmp = memcmp(sessionid, element->sessionid, shared->keysize)) &&
            (++cnt < shared->maxelements))
    {
        hidx = (hidx + shared->stepsize) % shared->maxelements;
        element = findelement(shash, hidx);
    }

    /* Continue to iterate under lock */
    pthread_mutex_lock(&shared->lock);

    /* Continue under lock.  Add 'cmp' check to prevent another memcmp */
    while(  (cmp) && 
            (element->flags & ELEMENT_IN_USE) &&
            (cmp = memcmp(sessionid, element->sessionid, shared->keysize)) &&
            (++cnt < shared->maxelements))
    {
        hidx = (hidx + shared->stepsize) % shared->maxelements;
        element = findelement(shash, hidx);
    }

    /* This scheme assumes that I can write 2 words atomically */
    if(cnt < shared->maxelements)
    {
        /* Increment write colision */
        if( (element->flags & ELEMENT_IN_USE) && 
            (memcmp(&element->userid, &userid, sizeof(element->userid))))
        {
            /* Increment write-collisions */
            shared->wcoll++;

            /* Maybe print some trace? */
            fprintf(stderr, "Shared-hash collision: replacing '%s' userid=%lld "
                    "with userid='%lld'.\n", sessionid, element->userid,  userid);

            /* Copy element into place */
            memcpy(&element->userid, &userid, sizeof(element->userid));
        }

        /* Set in use */
        else
        {
            /* Copy sessionid into place */
            memcpy(element->sessionid, sessionid, shared->keysize);

            /* Copy element into place */
            memcpy(&element->userid, &userid, sizeof(element->userid));

            /* This is now in use */
            element->flags |= ELEMENT_IN_USE;

            /* Increment element count */
            shared->numelements++;
        }

        /* Good return code */
        rtn = 0;

        /* This is a write */
        shared->nwrites++;
    }

    /* Unlock this */
    pthread_mutex_unlock(&shared->lock);

    return rtn;
}

/* Stats */
int sessionhash_stats(shash_t *shash, shash_stats_t *stats, int flags)
{
    sh_shared_t             *shared;

    /* Shared */
    shared = (sh_shared_t *)shash->sdata;

    /* Stats */
    if(flags & SHASH_STATS_NREADS)
        memcpy(&stats->nreads, &shared->nreads, sizeof(stats->nreads));

    if(flags & SHASH_STATS_NWRITES)
        memcpy(&stats->nwrites, &shared->nwrites, sizeof(stats->nwrites));

    if(flags & SHASH_STATS_NHITS)
        memcpy(&stats->nhits, &shared->nhits, sizeof(stats->nhits));

    if(flags & SHASH_STATS_NMISSES)
        memcpy(&stats->nmisses, &shared->nmisses, sizeof(stats->nmisses));

    if(flags & SHASH_STATS_MAXSTEPS)
        memcpy(&stats->maxsteps, &shared->maxsteps, sizeof(stats->maxsteps));

    if(flags & SHASH_STATS_HISTOGRAM)
        memcpy(&stats->steps, &shared->steps, sizeof(stats->steps));

    if(flags & SHASH_STATS_COUNT)
        memcpy(&stats->count, &shared->numelements, sizeof(stats->count));

    if(flags & SHASH_STATS_WCOLLISIONS)
        memcpy(&stats->wcoll, &shared->wcoll, sizeof(stats->wcoll));

    if(flags & SHASH_STATS_KEYSIZE)
        memcpy(&stats->keysize, &shared->keysize, sizeof(stats->keysize));

    return 0;
}


