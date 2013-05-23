#include <stdio.h>
#include <pthread.h>
#include <sys/ipc.h>
#include <sys/shm.h>

/* This is written in C because it will be linked into nginx as well as node.js.  
 * I can write and use very simple glue-functions within my node funtion.  I'll
 * be a little object-oriented-y and allow folks to declare a 'sessionhash' 
 * type (given a key).  Maybe the 'sessionhash_open' call will take a shmkey as
 * it's argument, and return a structure to it. */

/* I think I can do the read locklessly: a hash miss just goes to the next 
 * bucket by adding 'hash-step' (some number which is relatively prime to the 
 * size).  Until I get to an empty bucket, or until I've searched the entire 
 * table.
 *
 * I will assume that there are multiple writers, and that they should lock.
 * Once a session is written, it will not go away until a reboot.
 */

#define DEFAULT_KEY 0x5E55102
/*                    SESSION */

/* This is the handle returned to the user */
typedef struct sessionhash
{
    int             shmkey;
    int             shmid;
    int             misscount;
    void            *sdata;
}
sessionhash_t;

/* This structure is in shared memory */
typedef struct sessionhash_shared
{
    int headersz;
    int elementsz;
    int maxelements;
    int numelements;
    pthread_mutex_t wrlock;
}
sessionhash_shared_t;


