#ifndef _SESSIONHASH_H
#define _SESSIONHASH_H

#include <inttypes.h>

#ifndef _SESSIONHASH_INTERNAL
typedef struct sessionhash
{
    int             _x[1];
}
shash_t;
#endif

/* Create and return a sessionhash object */
shash_t *sessionhash_create(int shmkey, int keysz, int nelements);

/* Attach to a sessionhash object */
shash_t *sessionhash_attach(int shmkey);

/* Attach readonly to a sessionhash object */
shash_t *sessionhash_attach_readonly(int shmkey);

/* Destroy sessionhash handle */
void sessionhash_destroy(shash_t *s);

/* Retrieve user for this session */
long long sessionhash_find(shash_t *s, const char *key);

/* Add user for this session */
int sessionhash_add(shash_t *s, const char *key, long long userid);

/* Stats definition */
typedef struct shash_stats
{
    uint64_t                nreads;
    uint64_t                nhits;
    uint64_t                nmisses;
    uint64_t                maxsteps;
    uint64_t                nwrites;
    uint64_t                wcoll;
    uint64_t                steps[10];
    int                     count;
    int                     keysize;
    int                     maxelements;
}
shash_stats_t;

/* Stats request enum */
enum stats_request
{
    /* Number of reads count */
    SHASH_STATS_NREADS      = 0x00000001 

    /* Number of writes count */
   ,SHASH_STATS_NWRITES     = 0x00000002

    /* Number of successful reads */
   ,SHASH_STATS_NHITS       = 0x00000004

    /* Number of unsuccessful reads */
   ,SHASH_STATS_NMISSES     = 0x00000008

    /* Maximum steps taken for a find */
   ,SHASH_STATS_MAXSTEPS    = 0x00000010

    /* Step histogram */
   ,SHASH_STATS_HISTOGRAM   = 0x00000020

    /* Element count */
   ,SHASH_STATS_COUNT       = 0x00000040

    /* Maximum size */
   ,SHASH_STATS_MAXELEMENTS = 0x00000080

    /* Replaced userids */
   ,SHASH_STATS_WCOLLISIONS = 0x00000100

    /* Key size */
   ,SHASH_STATS_KEYSIZE     = 0x00000200
};

/* Get stats */
int sessionhash_stats(shash_t *s, shash_stats_t *stats, int flags);

#endif
