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
 * I'm revising the structure of this to allow for deletes, and more predictable
 * behavior when the hash nears being full.  The downside is that I will no 
 * longer be able to do things locklessly.
 *
 * Now I'm going to initialize a set of 'head-pointers' that will contain the
 * indexes of the first elements.  
 *
 * There's no more lockless access unfortunately.
 *
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

typedef struct headpointer

#define _SESSIONHASH_INTERNAL
#include "sessionhash.h"

enum sh_flags
{
    ELEMENT_IN_USE          = 0x00000001
   ,ELEMENT_ON_FREELIST     = 0x00000002
};

/* Maps sessionid to userid */
typedef struct sesssionhash_element
{
    unsigned int            flags;
    int                     next;
    int                     prev;
    long long               userid;
    char                    sessionid[1];
}
sh_element_t;

/* Hash-heads */
typedef struct sessionhash_head
{
    pthread_rwlock_t        lock;
    int                     head;
    int                     count;
}
sh_head_t;

/* This structure is in shared memory */
typedef struct sessionhash_shared
{
    /* Make sure this is sane */
    int                     magic;

    /* Define meta-informaion */
    int                     segsize;
    int                     headersize;
    int                     keysize;
    int                     numbuckets;
    int                     elementsize;
    int                     maxelements;
    int                     numelements;
    int                     maxlog10;

    /* Lockless stats */
    uint64_t                nreads;
    uint64_t                nwrites;
    uint64_t                nhits;
    uint64_t                nmisses;
    uint64_t                maxsteps;

    /* Freelist */
    sh_head_t               freelist;

    /* Hash */
    sh_head_t               buckets[1];
}
sh_shared_t;

/* Given an index and a shared segment return this element */
static inline sh_element_t *findelementsh(sh_shared_t *shared, int idx)
{
    char                    *ptr;

    /* Beginning of data */
    ptr = (char *)shared + shared->headersize;

    /* Correct offset */
    ptr += (idx * shared->elementsize);

    /* Cast offset to sh_element_t */
    return (sh_element_t *)ptr;
}

/* Given an index return an sh_element_t */
static inline sh_element_t *findelement(shash_t *shash, int idx)
{
    sh_shared_t             *shared;

    /* Shared */
    shared = (sh_shared_t *)shash->sdata;

    /* Find element shared */
    return findelementsh(shared, idx);
}

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
    int                     nel10;
    int                     ii;
    shash_t                 *shash;
    sh_element_t            *element;
    sh_shared_t             *shared;
    pthread_rwlockattr_t    attr;
    size_t                  sz;
    size_t                  nbuckets;
    size_t                  barraysz;
    size_t                  elsz;

    /* Calculate size of element */
    elsz = offsetof(sh_element_t, sessionid) + keysz;

    /* Bucket list is 4 times the number of elements */
    nbuckets = nelements << 2;

    /* Bucketarray size */
    barraysz = nbuckets * sizeof(sh_head_t);
    
    /* Calculate size */
    sz = offsetof(sh_shared_t, buckets) + barraysz + (nelements * elsz);

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
    shared->headersize = offsetof(sh_shared_t, buckets) + barraysz;
    shared->segsize = sz;
    shared->keysize = keysz;
    shared->elementsize = elsz;
    shared->maxelements = nelements;
    shared->numbuckets = nbuckets;
    shared->numelements = 0;
    shared->maxlog10 = 1;

    /* 0-based idx */
    nel10 = nelements-1;

    /* Index field width */
    while(nel10 /= 10) 
        shared->maxlog10++;

    /* Rwlock attribute object */
    pthread_rwlockattr_init(&attr);
    pthread_rwlockattr_setpshared(&attr, PTHREAD_PROCESS_SHARED);
    pthread_rwlockattr_setkind_np(&attr, PTHREAD_RWLOCK_PREFER_WRITER_NONRECURSIVE_NP);

    /* Initialize head list */
    for(ii = 0; ii < nbuckets; ii++)
    {
        shared->buckets[i].head = -1;
        pthread_rwlock_init(&shared->buckets[i].lock, &attr);
    }

    /* All elements are on the free list */
    for(ii = 0; ii < nelements; ii++)
    {
        element = findelementsh(shared, ii);

        element->prev = ii-1;
        element->next = ii+1;
    }

    /* Tweak last element next */
    element->next = -1;

    /* Initialize free list */
    pthread_rwlock_init(&shared->freelist.lock, &attr);

    /* Head is element 0 */
    shared->freelist.head = 0;

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
static shash_t *sessionhash_attach_readonly(int shmkey)
{
    return sessionhash_attach_int(shmkey, 1);
}

/* Destroy a sessionhash handle */
void sessionhash_destroy(shash_t *shash)
{
    free(shash);
}

/* Find this session and return the user */
long long sessionhash_find(shash_t *shash, const char *insessionid)
{
    char                    *sessionid;
    uint32_t                hidx;
    uint32_t                hcnt;
    sh_head_t               *bhead;
    sh_shared_t             *shared;
    sh_element_t            *element;
    long long               rtn = -1;
    int                     cnt = 0;
    int                     cmp = 1;
    int                     ln;
    int                     histcnt;

    /* Shared */
    shared = (sh_shared_t *)shash->sdata;

    /* Update stats */
    shared->nreads++;

    /* Check argument size */
    if((ln = strlen(insessionid)) > shared->keysize)
    {
        shared->nmisses++;
        return -1;
    }

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
    hidx = s_hash(sessionid, strlen(sessionid)) % shared->nbuckets;

    /* Bucket-head */
    bhead = &shared->buckets[hidx];

    /* Readlock bucket head.  TODO maybe functionize this & use trylock */
    pthread_rwlock_rdlock(&bhead->lock);

    /* Punt if empty */
    if(0 == bhead->count)
    {
        pthread_rwlock_unlock(&bhead->lock);
        shared->nmisses++;
        return -1;
    }

    /* Walk the chain */
    for(hidx = bhead->head, hcnt = 0 ; hidx > 0 && hcnt < bhead->count ; 
            hidx = element->next, hcnt++)
    {
        element = findelement(shash, hidx);
        if(cmp = memcmp(sessionid, element->sessionid, shared->keysize))
            break;
    }

    element = findelement(shash, hidx);

    /* Iterate until match or miss */
    while(  (element->flags & ELEMENT_IN_USE) && 
            (cmp = memcmp(sessionid, element->sessionid, shared->keysize)) &&
            (++cnt < shared->maxelements))
    {
        hidx = (hidx + shared->stepsize) % shared->maxelements;
        element = findelement(shash, hidx); 
    }

    /* Copy out user id if this is a hit */
    if(!cmp)
    {
        /* Copy out userid */
        memcpy(&rtn, &element->userid, sizeof(element->userid));

        /* Update hits */
        shared->nhits++;
    }

    /* Update misses */
    else
        shared->nmisses++;

    /* Update max steps */
    if(cnt > shared->maxsteps)
        shared->maxsteps = cnt;

    /* Cap at last */
    if(cnt < shared->maxelements)
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

    /* If this is half-full punt */
    if(shared->numelements >= (shared->maxelements >> 1))
        return -1;

    /* Check length */
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
//            shared->wcoll++;

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

            /* Increment element count */
            if(!element->flags & ELEMENT_IN_USE) 
                shared->numelements++;

            /* This is now in use */
            element->flags |= ELEMENT_IN_USE;

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

    if(flags & SHASH_STATS_MAXELEMENTS)
        memcpy(&stats->maxelements, &shared->maxelements, 
                sizeof(stats->maxelements));

    if(flags & SHASH_STATS_NUMELEMENTS)
        memcpy(&stats->numelements, &shared->numelements, 
                sizeof(stats->numelements));

    /*
    if(flags & SHASH_STATS_WCOLLISIONS)
        memcpy(&stats->wcoll, &shared->wcoll, sizeof(stats->wcoll));
        */

    if(flags & SHASH_STATS_KEYSIZE)
        memcpy(&stats->keysize, &shared->keysize, sizeof(stats->keysize));

    if(flags & SHASH_STATS_SEGSIZE)
        memcpy(&stats->segsize, &shared->segsize, sizeof(stats->segsize));

    return 0;
}

/* Dump this element */
static inline int sessionhash_dump_element(sh_element_t *element, int idx, 
        int idxfw, int keysize, FILE *f)
{
    fprintf(f, "%*d: '%*s' -> %lld\n", idxfw, idx, keysize, element->sessionid,
            element->userid);
}

/* Dump the sessionhash */
int sessionhash_dump(shash_t *shash, FILE *f, int flags)
{
    sh_shared_t             *shared;
    sh_element_t            *element;
    int                     ii;

    /* Shared */
    shared = (sh_shared_t *)shash->sdata;

    /* Loop */
    for(ii = 0; ii < shared->maxelements; ii++)
    {
        /* Element */
        element = findelement(shash, ii);

        if((element->flags & ELEMENT_IN_USE) || (flags & SHASH_DUMP_UNUSED))
        {
            sessionhash_dump_element(element, ii, shared->maxlog10, 
                    shared->keysize, f);
        }
    }
}

/* Copy out steps histogram */
uint64_t *sessionhash_steps(shash_t *shash, int *nelements)
{
    sh_shared_t             *shared;
    uint64_t                *steps;
    
    /* Shared */
    shared = (sh_shared_t *)shash->sdata;

    /* Grab memory */
    steps = (uint64_t *)malloc(sizeof(uint64_t) * shared->maxelements);

    /* Memcpy */
    memcpy(steps, shared->steps, sizeof(uint64_t) * shared->maxelements);

    /* Set nelements */
    *nelements = shared->maxelements;

    /* Return */
    return steps;
}

