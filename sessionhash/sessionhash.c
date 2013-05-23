#include <stdio.h>
#include <pthread.h>
#include <strings.h>
#include <sys/ipc.h>
#include <sys/shm.h>

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

/* This is the handle returned to the user */
typedef struct sessionhash
{
    int             shmkey;
    int             shmid;
    int             misscount;
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
    char                    sessionid[80];
    long long               userid;
}
sh_element_t;

/* This structure is in shared memory */
typedef struct sessionhash_shared
{
    int                     headersz;
    int                     elementsize;
    int                     maxelements;
    int                     numelements;
    pthread_mutex_t         lock;
    char                    element[1];
}
sh_shared_t;

/* Create a sessionhash */
shash_t *sessionhash_create(int shmkey, int nelements)
{
    int                     shmid;
    sh_shared_t             *shared;
    pthread_mutexattr_t     attr;
    size_t                  sz;

    /* Calculate size */
    sz = offsetof(sh_shared_t, element) + (nelements * sizeof(sh_element_t));

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
    shared = shmat(shmid, NULL, 0);

    /* Make sure this succeeded */
    if(-1 == (int) shared)
    {
        fprintf(stderr, "%s error attaching to segment shmid %d: %s\n", 
                __func__, shmid, strerror(errno));
        return NULL;
    }

    /* Zero segment */
    bzero(shared, sz);

    /* Setup */
    shared->headersize = offsetof(shared, element);
    shared->elementsize = sizeof(sh_element_t);
    shared->maxelements = nelements;
    shared->numelements = 0;

    /* Create shared mutex */
    pthread_mutexattr_init(&attr);
    pthread_mutexattr_setpshared(&attr, PTHREAD_PROCESS_SHARED);
    pthread_mutex_init(&shared->lock, attr);


}
