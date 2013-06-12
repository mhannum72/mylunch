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
#include <assert.h>
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

#define _SESSIONHASH_INTERNAL
#include "sessionhash.h"

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
    int                     nbuckets;
    int                     elementsize;
    int                     maxelements;
    int                     maxlog10;

    /* Lockless stats */
    uint64_t                nreads;
    uint64_t                nwrites;
    uint64_t                nhits;
    uint64_t                nmisses;

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

/* Allocate an shash object */
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
    shared->nbuckets = nbuckets;
    shared->maxlog10 = 1;

    /* 0-based idx */
    nel10 = nbuckets-1;

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
        shared->buckets[ii].head = -1;
        pthread_rwlock_init(&shared->buckets[ii].lock, &attr);
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

    /* All elements are on the freelist */
    shared->freelist.count = nelements;

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
    sh_element_t            *element = NULL;
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
        return SHASH_KEY_TOO_BIG;
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

    /* Walk the chain */
    for(hidx = bhead->head, hcnt = 0 ; hidx >= 0 && hcnt < bhead->count ; 
            hidx = element->next, hcnt++)
    {
        element = findelementsh(shared, hidx);
        if(0 == (cmp = memcmp(sessionid, element->sessionid, shared->keysize)))
            break;
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

    /* Unlock */
    pthread_rwlock_unlock(&bhead->lock);

    /* Return value */
    return rtn;
}

/* Delete this sessionid */
int sessionhash_delete(shash_t *shash, const char *insessionid)
{
    char                    *sessionid;
    uint32_t                hidx;
    uint32_t                hcnt;
    sh_head_t               *bhead;
    sh_shared_t             *shared;
    sh_element_t            *element;
    sh_element_t            *next = NULL;
    sh_element_t            *prev = NULL;
    sh_element_t            *frel = NULL;
    int                     col = 0;
    int                     cnt = 0;
    int                     cmp = 1;
    int                     ln;
    int                     rtn = SHASH_NOT_FOUND;

    /* Shared */
    shared = (sh_shared_t *)shash->sdata;

    /* Check length */
    if((ln = strlen(insessionid)) > shared->keysize)
        return SHASH_KEY_TOO_BIG;

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

    /* Write lock */
    pthread_rwlock_wrlock(&bhead->lock);

    /* Walk the chain */
    for(hidx = bhead->head, hcnt = 0 ; hidx >= 0 && hcnt < bhead->count ; 
            hidx = element->next, hcnt++)
    {
        element = findelementsh(shared, hidx);
        if(0 == (cmp = memcmp(sessionid, element->sessionid, shared->keysize)))
            break;
    }

    /* Found it */
    if(!cmp)
    {
        /* Clip next element */
        if(element->next >= 0)
        {
            next = findelementsh(shared, element->next);
            next->prev = element->prev;
        }

        /* Clip prev element */
        if(element->prev >= 0)
        {
            prev = findelementsh(shared, element->prev);
            prev->next = element->next;
        }

        /* Move head to next */
        if(hidx == bhead->head)
        {
            bhead->head = element->next;
        }
        
        /* Decrement number of elements */
        bhead->count--;
    }

    /* Unlock */
    pthread_rwlock_unlock(&bhead->lock);

    if(!cmp)
    {
        /* Lock freelist */
        pthread_rwlock_wrlock(&shared->freelist.lock);

        /* Set prev of the head */
        if(shared->freelist.head >= 0)
        {
            frel = findelementsh(shared, shared->freelist.head);
            frel->prev = hidx;
        }

        /* Set my next to the freehead */
        element->next = shared->freelist.head;

        /* New free head */
        shared->freelist.head = hidx;

        /* Increment */
        shared->freelist.count++;

        /* Unlock */
        pthread_rwlock_unlock(&shared->freelist.lock);

        /* This is a write */
        shared->nwrites++;

        /* Valid return code */
        rtn = SHASH_OK;
    }

    return rtn;;
}

/* Add this key->userid mapping to sessionhash */
int sessionhash_add(shash_t *shash, const char *insessionid, long long userid)
{
    char                    *sessionid;
    uint32_t                hidx;
    uint32_t                hcnt;
    sh_head_t               *bhead;
    sh_shared_t             *shared;
    sh_element_t            *element;
    sh_element_t            *next;
    int                     col = 0;
    int                     cnt = 0;
    int                     cmp = 1;
    int                     ln;

    /* Shared */
    shared = (sh_shared_t *)shash->sdata;

    /* Check length */
    if((ln = strlen(insessionid)) > shared->keysize)
        return SHASH_KEY_TOO_BIG;

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

    /* Write lock */
    pthread_rwlock_wrlock(&bhead->lock);

    /* Walk the chain */
    for(hidx = bhead->head, hcnt = 0 ; hidx >= 0 && hcnt < bhead->count ; 
            hidx = element->next, hcnt++)
    {
        element = findelementsh(shared, hidx);
        if(0 == (cmp = memcmp(sessionid, element->sessionid, shared->keysize)))
        {
            col = 1;
            break;
        }
    }

    /* Allocate from the freelist */
    if(cmp)
    {
        /* Lock the freelist */
        pthread_rwlock_wrlock(&shared->freelist.lock);

        /* Empty */
        if(-1 == shared->freelist.head)
        {
            /* Unlock freelist */
            pthread_rwlock_unlock(&shared->freelist.lock);

            /* Unlock bucket */
            pthread_rwlock_unlock(&bhead->lock);

            /* No space */
            return SHASH_NO_SPACE;
        }

        /* Take index from the head */
        hidx = shared->freelist.head; 

        /* Resolve the element */
        element = findelementsh(shared, hidx);

        /* Head is the next in the chain */
        shared->freelist.head = element->next;

        /* Decrement */
        shared->freelist.count--;

        /* Reset next element's prev */
        if(element->next >= 0)
        {
            next = findelementsh(shared, element->next);
            next->prev = -1;
        }

        /* Finished with freelist */
        pthread_rwlock_unlock(&shared->freelist.lock);

        /* Add new element to the head of the bucket */
        element->next = bhead->head;

        /* This will be the first element */
        element->prev = -1;

        /* Reset next element's prev */
        if(bhead->head >= 0)
        {
            next = findelementsh(shared, bhead->head);
            next->prev = hidx;
        }

        /* New head */
        bhead->head = hidx;

        /* Copy element in place */
        memcpy(element->sessionid, sessionid, shared->keysize);

        /* Increment count */
        bhead->count++;
    }

    /* Copy userid in place */
    memcpy(&element->userid, &userid, sizeof(element->userid));

    /* Maybe print some trace? */
    if(col)
        fprintf(stderr, "Shared-hash collision: replacing '%s' userid=%lld "
                "with userid='%lld'.\n", sessionid, element->userid,  userid);

    /* Unlock bucket */
    pthread_rwlock_unlock(&bhead->lock);

    /* This is a write */
    shared->nwrites++;

    /* Good rcode */
    return SHASH_OK;
}

/* Stats */
int sessionhash_stats(shash_t *shash, shash_stats_t *stats, int flags)
{
    sh_shared_t             *shared;
    int                     val;

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

    if(flags & SHASH_STATS_MAXELEMENTS)
        memcpy(&stats->maxelements, &shared->maxelements, 
                sizeof(stats->maxelements));

    if(flags & SHASH_STATS_NUMELEMENTS)
    {
        pthread_rwlock_rdlock(&shared->freelist.lock);
        val = shared->maxelements - shared->freelist.count;
        pthread_rwlock_unlock(&shared->freelist.lock);
        memcpy(&stats->numelements, &val, 
                sizeof(stats->numelements));
    }

    if(flags & SHASH_STATS_KEYSIZE)
        memcpy(&stats->keysize, &shared->keysize, sizeof(stats->keysize));

    if(flags & SHASH_STATS_SEGSIZE)
        memcpy(&stats->segsize, &shared->segsize, sizeof(stats->segsize));

    return 0;
}

/* Dump this element */
static inline int sessionhash_dump_element(sh_element_t *element, int keysize, 
        FILE *f)
{
    fprintf(f, "'%*s'->%lld", keysize, element->sessionid,
            element->userid);
}

/* Dump the sessionhash */
int sessionhash_dump(shash_t *shash, FILE *f, int flags)
{
    sh_shared_t             *shared;
    sh_element_t            *element;
    sh_head_t               *bhead;
    uint32_t                hcnt;
    uint32_t                ii;
    uint32_t                hidx;

    /* Shared */
    shared = (sh_shared_t *)shash->sdata;

    /* Loop */
    for(ii = 0; ii < shared->nbuckets; ii++)
    {
        /* Bucket head */
        bhead = &shared->buckets[ii];

        /* Print */
        fprintf(f, "Bucket %*d ", shared->maxlog10, ii);

        /* Lock */
        pthread_rwlock_rdlock(&bhead->lock);

        /* Print count */
        fprintf(f, "%*d elements ", shared->maxlog10, bhead->count);

        /* Walk the chain */
        for(hidx = bhead->head, hcnt = 0 ; hidx >= 0 && hcnt < bhead->count ; 
                hidx = element->next, hcnt++)
        {
            /* Leading space */
            if(hidx == bhead->head) fprintf(f, " ");

            /* Separte elements by comma */
            else fprintf(f, ", ");

            /* Resolve element */
            element = findelementsh(shared, hidx);

            /* Print */
            sessionhash_dump_element(element, shared->keysize, f);
        }

        /* Lock */
        pthread_rwlock_unlock(&bhead->lock);

        /* Trailing newline */
        fprintf(f, "\n");
    }

    /* Dump the freelist */
    if(flags & SHASH_DUMP_FREELIST)
    {
        fprintf(f, "Freelist: ");
        pthread_rwlock_rdlock(&shared->freelist.lock);
        fprintf(f, "%*d elements ", shared->maxlog10, shared->freelist.count);

        for(hidx = shared->freelist.head, hcnt = 0 ; hidx >= 0 && hcnt < 
                shared->freelist.count ; hidx = element->next, hcnt++)
        {
            /* Resolve element */
            element = findelementsh(shared, hidx);

            fprintf(f, "%d ", hidx);
        }

        pthread_rwlock_unlock(&shared->freelist.lock);
        fprintf(f, "\n");
    }
    return 0;
}

