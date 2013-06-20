#ifndef _SESSIONHASH_H
#define _SESSIONHASH_H

#ifdef __cplusplus
extern "C" {
#endif

#include <inttypes.h>

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

/* Create and return a sessionhash object */
shash_t *sessionhash_create(int shmkey, int keysz, int nelements);

/* Attach to a sessionhash object */
shash_t *sessionhash_attach(int shmkey);

/* Return a small integer handle for javascript */
int sessionhash_attach_handle(int shmkey);

/* Attach readonly to a sessionhash object */
/* Deprecated until stats are in a different segment */
/* shash_t *sessionhash_attach_readonly(int shmkey); */

/* Destroy sessionhash handle */
void sessionhash_destroy(shash_t *s);

/* Rcodes for sessionhash */
enum
{
    /* Successful add/find/delete */
    SHASH_OK                = 0

    /* Could not find */
   ,SHASH_NOT_FOUND         = -1

    /* No space left */
   ,SHASH_NO_SPACE          = -2

    /* Key too big */
   ,SHASH_KEY_TOO_BIG       = -3
};

/* Retrieve user for this session */
long long sessionhash_find(shash_t *s, const char *key);

/* Add user for this session */
int sessionhash_add(shash_t *s, const char *key, long long userid);

/* Javascript add user for this session */
int sessionhash_add_handle(int handle, const char *key, long long userid);

/* Javascript add user for this session */
int sessionhash_delete_handle(int handle, const char *key);

/* Javascript add user for this session */
long long sessionhash_find_handle(int handle, const char *key);

/* Delete this session */
int sessionhash_delete(shash_t *s, const char *key);

/* Clear all locks */
int sessionhash_clearlocks(shash_t *s);

/* Stats definition */
typedef struct shash_stats
{
    uint64_t                nreads;
    uint64_t                nhits;
    uint64_t                nmisses;
    uint64_t                nwrites;
    uint64_t                wcoll;
    int                     keysize;
    int                     numelements;
    int                     maxelements;
    int                     segsize;
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

    /* Key size */
   ,SHASH_STATS_KEYSIZE     = 0x00000010

   /* Segment size */
   ,SHASH_STATS_SEGSIZE     = 0x00000020

   /* Current number of elements */
   ,SHASH_STATS_NUMELEMENTS = 0x00000040

    /* Maximum size */
   ,SHASH_STATS_MAXELEMENTS = 0x00000080
};

/* Get stats */
int sessionhash_stats(shash_t *s, shash_stats_t *stats, int flags);

/* Dump flags enum */
enum dump_flags
{
    /* Include unused entries in dump */
    SHASH_DUMP_FREELIST     = 0x00000001
   ,SHASH_DUMP_BUCKETS      = 0x00000002
   ,SHASH_DUMP_CTIME        = 0x00000004
   ,SHASH_DUMP_ATIME        = 0x00000008
};

/* Dump the sessionhash */
int sessionhash_dump(shash_t *s, FILE *f, int flags);


/* Dump sessionhash entries older than now - howold */
int sessionhash_dump_old(shash_t *s, FILE *f, int howold, int flags);

#ifdef __cplusplus
}
#endif

#endif
