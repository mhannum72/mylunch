#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "sessionhash.h"
#include "base64.h"

/* Arg0 */
const char *argv0;

/* Usage menu */
void usage(const char *argv0, FILE *f)
{
    fprintf(f,  "Usage: %s <opts>\n", argv0);
    fprintf(f,  "-k <key>               - Set hex shmkey\n");
    fprintf(f,  "-s <sessionid>         - Set sessionid (base64)\n");
    fprintf(f,  "-S <sessionid>         - Set sessionid (convert to base64)\n");
    fprintf(f,  "-u <userid>            - Set userid\n");
    fprintf(f,  "-C <keysz>:<count>     - Create sessionhash\n");
    fprintf(f,  "-a                     - Add sessionid\n");
    fprintf(f,  "-f                     - Find sessionid\n");
    fprintf(f,  "-x                     - Delete sessionid\n");
    fprintf(f,  "-L                     - Clear all locks\n");
    fprintf(f,  "-t                     - Retrieve stats\n");
    fprintf(f,  "-d                     - Dump sessionhash\n");
    fprintf(f,  "-D <time>              - Dump entries not accessed for <time> seconds\n");
    fprintf(f,  "-h                     - This menu\n");
    exit(1);
}

/* State enums */
enum 
{
    MODE_UNSET              = 0
   ,MODE_CREATE             = 1
   ,MODE_FIND               = 2
   ,MODE_ADD                = 3
   ,MODE_CLEAR              = 4
   ,MODE_DELETE             = 5
   ,MODE_STATS              = 6
   ,MODE_DUMP               = 7
};

/* Mode variable */
static int mode = MODE_UNSET;

/* Print stats */
static int print_stats(shash_stats_t *stats, FILE *f)
{
    int                     i;

    fprintf(f, "nreads                      %lld\n", stats->nreads);
    fprintf(f, "nhits                       %lld\n", stats->nhits);
    fprintf(f, "nmisses                     %lld\n", stats->nmisses);
    fprintf(f, "nwrites                     %lld\n", stats->nwrites);
    fprintf(f, "wcoll                       %lld\n", stats->wcoll);
    fprintf(f, "numelements                 %d\n", stats->numelements);
    fprintf(f, "maxelements                 %d\n", stats->maxelements);
    fprintf(f, "segsize                     %d\n", stats->segsize);
    fprintf(f, "\n");
}

/* Main */
int main(int argc, char *argv[])
{
    int                     c;
    int                     dflags = 0;
    int                     nelements;
    int                     keysz;
    int                     err = 0;
    int                     dtime = -1;
    int                     rc;
    int                     key = -1;
    char                    *sessionid = NULL;
    char                    *colon = NULL;
    long long               userid = -1;
    shash_t                 *shash;
    shash_stats_t           stats = {0};
    uint64_t                *steps;

    /* Latch arg0 */
    argv0 = argv[0];

    while(-1 != (c = getopt(argc, argv, "k:s:S:u:C:LdD:aftxh")))
    {
        switch(c)
        {
            /* Set key */
            case 'k':
                key = strtol(optarg, NULL, 0);
                break;

            /* Set the sessionid */
            case 's':
                sessionid = optarg;
                break;

            /* Convert to base64 and set sessionid */
            case 'S':
                sessionid = base64_encode(optarg, strlen(optarg), NULL);
                break;

            /* Set the userid */
            case 'u':
                userid = atoll(optarg);
                break;

            /* Create */
            case 'C':
                mode = MODE_CREATE;
                if(!(colon = strchr(optarg, ':')))
                {
                    fprintf(stderr, "Create argument is <keysize>:<elementcnt>.\n");
                    exit(1);
                }
                *colon = '\0';
                keysz = atoi(optarg);
                nelements = atoi(&colon[1]);
                break;

            /* Add */
            case 'a':
                mode = MODE_ADD;
                break;

            /* Delete */
            case 'x':
                mode = MODE_DELETE;
                break;

            /* Find */
            case 'f':
                mode = MODE_FIND;
                break;

            /* Clear locks */
            case 'L':
                mode = MODE_CLEAR;
                break;

            /* Stats */
            case 't':
                mode = MODE_STATS;
                break;

           /* Dump old entries in the hash */
            case 'D':
                dflags = SHASH_DUMP_FREELIST;
                dtime = atoi(optarg);

            /* Dump hash */
            case 'd':
                mode = MODE_DUMP;
                dflags = SHASH_DUMP_FREELIST;
                break;

            /* Usage menu */
            case 'h':
                usage(argv0, stdout);
                break;

            /* Error */
            default:
                fprintf(stderr, "Invalid option '%c'.\n", c);
                usage(argv0, stderr);
                break;
        }
    }

    /* If mode isn't set exit */
    if(MODE_UNSET == mode)
    {
        fprintf(stderr, "Mode is not set.\n");
        usage(argv0, stderr);
    }

    if(-1 == key)
    {
        fprintf(stderr, "Key is not set.\n");
        usage(argv0, stderr);
    }

    /* Switch on the mode */
    switch(mode)
    {
        case MODE_CREATE:

            /* Create shash */
            shash = sessionhash_create(key, keysz, nelements);

            /* Punt on error */
            if(!shash) 
            {
                fprintf(stderr, "Error creating session_hash, key=0x%x.\n", key);
            }
            else
            {
                fprintf(stdout, "Created sessionhash with %d maximum elements\n", 
                        nelements);
            }
            break;

        case MODE_FIND:

            /* Verify args */
            if(NULL == sessionid)
            {
                fprintf(stderr, "Sessionid must be set for find.\n");
                exit(1);
            }

            /* Attach shash */
            shash = sessionhash_attach(key);
            if(!shash) 
            {
                fprintf(stderr, "Error attaching to session_hash, key=0x%x.\n", key);
                exit(1);
            }

            /* Find */
            userid = sessionhash_find(shash, sessionid);

            /* Failed */
            if(-1 == userid)
                fprintf(stderr, "Not found.\n");

            /* Found */
            else
                fprintf(stderr, "%lld\n", userid);

            break;
            
        case MODE_DELETE:
            /* Verify sessionid args */
            if(NULL == sessionid)
            {
                fprintf(stderr, "Sessionid must be set for delete.\n");
                exit(1);
            }

            /* Attach shash */
            shash = sessionhash_attach(key);
            if(!shash) 
            {
                fprintf(stderr, "Error attaching to session_hash, key=0x%x.\n", key);
                exit(1);
            }

            /* Delete */
            rc = sessionhash_delete(shash, sessionid);
            if(0 != rc)
            {
                fprintf(stderr, "Error deleting from sessionhash, rc=%d\n", rc);
                exit(1);
            }

            /* Success */
            break;

        case MODE_ADD:

            /* Verify sessionid args */
            if(NULL == sessionid)
            {
                fprintf(stderr, "Sessionid must be set for add.\n");
                exit(1);
            }

            /* Verify userid arg */
            if(-1 == userid)
            {
                fprintf(stderr, "Userid must be set for add.\n");
                exit(1);
            }

            /* Attach shash */
            shash = sessionhash_attach(key);
            if(!shash) 
            {
                fprintf(stderr, "Error attaching to session_hash, key=0x%x.\n", key);
                exit(1);
            }

            /* Add */
            rc = sessionhash_add(shash, sessionid, userid);
            if(0 != rc)
            {
                fprintf(stderr, "Error adding to sessionhash, rc=%d\n", rc);
                exit(1);
            }

            /* Success */
            break;

        case MODE_CLEAR:
            /* Attach shash */
            shash = sessionhash_attach(key);
            if(!shash) 
            {
                fprintf(stderr, "Error attaching to session_hash, key=0x%x.\n", key);
                exit(1);
            }

            /* Clear */
            sessionhash_clearlocks(shash);

            break;

        case MODE_STATS:

            /* Attach shash */
            shash = sessionhash_attach(key);
            if(!shash) 
            {
                fprintf(stderr, "Error attaching to session_hash, key=0x%x.\n", key);
                exit(1);
            }

            /* Get stats */
            sessionhash_stats(shash, &stats, 
                SHASH_STATS_NREADS|SHASH_STATS_NWRITES|SHASH_STATS_NHITS|
                SHASH_STATS_NMISSES|SHASH_STATS_NUMELEMENTS|
                SHASH_STATS_MAXELEMENTS| SHASH_STATS_SEGSIZE);

            /* Print the stats */
            print_stats(&stats, stdout);
            break;

        case MODE_DUMP:

            /* Attach shash */
            shash = sessionhash_attach(key);
            if(!shash) 
            {
                fprintf(stderr, "Error attaching to session_hash, key=0x%x.\n", key);
                exit(1);
            }

            /* Dump the hash */
            sessionhash_dump_old(shash, stdout, dtime, dflags);
            break;

        default:
            abort();
            break;
    }

    return 0;
}
