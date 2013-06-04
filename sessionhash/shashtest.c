#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "sessionhash.h"
#include "base64.h"

/* Default key */
#define DEFAULTKEY 0x12345678

/* Arg0 */
const char *argv0;

/* Usage menu */
void usage(const char *argv0, FILE *f)
{
    fprintf(f,  "Usage: %s <opts>\n", argv0);
    fprintf(f,  "-k <key>               - Set hex shmkey\n");
    fprintf(f,  "-S <sessionid-base>    - Set base sessionid (convert to base64)\n");
    fprintf(f,  "-L <low-bound>         - Set low bound\n");
    fprintf(f,  "-H <high-bound>        - Set high bound\n");
    fprintf(f,  "-t <threads>           - Set number of threads\n");
    fprintf(f,  "-i <iterations>        - Set number of iterations\n");
    fprintf(f,  "-a                     - Set add mode\n");
    fprintf(f,  "-f                     - Set find mode\n");
    fprintf(f,  "-h                     - This menu\n");
    exit(1);
}

/* State enums */
enum 
{
    MODE_UNSET              = 0
   ,MODE_ADD                = 1
   ,MODE_FIND               = 2
};

/* Mode variable */
static int mode = MODE_UNSET;

/* Session id base */
static char *sessionbase = "default";

/* Low boundary */
static int lowbound = 0;

/* High boundary */
static int highbound = 16777216;

/* Number of threads */
static int threadcnt = 10;

/* Number of iterations */
static int iterations = 32768;

/* Key to attach to */
static int key = DEFAULTKEY;

/* Generate & encode a random session string */
static inline char *randsession(long long *userid)
{
    int                     rnd ;
    char                    workbase[80];
    
    /* Random session */
    rnd = (lrand48() % (highbound - lowbound)) + lowbound;

    /* Copy userid */
    *userid = rnd;

    /* Session string */
    snprintf(workbase, sizeof(workbase), "%s%d", sessionbase, rnd);

    /* Convert to base64 */
    return base64_encode(workbase, strlen(workbase), NULL);
}

/* Find thread */
static void *find_thd(void *arg)
{
    int                     i;
    char                    *sessbase;
    shash_t                 *shash;
    long long               fnduserid;
    long long               userid;

    /* Attach to session readonly */
    shash = sessionhash_attach(key);

    /* Punt if we can't attach */
    if(!shash)
    {
        fprintf(stderr, "Thd %d cannot attach to shash.\n", pthread_self());
        return NULL;
    }

    /* Iterate */
    for(i = 0 ; (0 >= iterations) || (i < iterations) ; i++)
    {
        /* Get a random session */
        sessbase = randsession(&userid);

        /* Find it */
        fnduserid = sessionhash_find(shash, sessbase);

        /* Either not found or found and equal to userid */
        if(fnduserid > 0 && fnduserid != userid)
        {
            fprintf(stderr, "Error thd %d: fnduserid is %lld should be %lld.\n",
                    pthread_self(), fnduserid, userid);
        }

        /* Free */
        free(sessbase);
    }

    /* Cleanup */
    sessionhash_destroy(shash);

    /* Return */
    return NULL;
}

/* Add thread */
static void *add_thd(void *arg)
{
    int                     i;
    int                     rc;
    char                    *sessbase;
    shash_t                 *shash;
    long long               fnduserid;
    long long               userid;

    /* Attach to session */
    shash = sessionhash_attach(key);

    /* Punt if we can't attach */
    if(!shash)
    {
        fprintf(stderr, "Thd %d cannot attach to shash.\n", pthread_self());
        return NULL;
    }

    /* Iterate */
    for(i = 0 ; (0 >= iterations) || (i < iterations) ; i++)
    {
        /* Get a random session */
        sessbase = randsession(&userid);

        /* Add it */
        if(rc = sessionhash_add(shash, sessbase, userid))
        {
            fprintf(stderr, "Error adding session-base '%s', rc=%d\n", 
                    sessbase, rc);
        }

        /* Free */
        free(sessbase);
    }

    /* Cleanup */
    sessionhash_destroy(shash);

    /* Return */
    return NULL;
}

typedef void *(thdfunc)(void *);

/* Main */
int main(int argc, char *argv[])
{
    int                     c;
    int                     ii;
    int                     err = 0;
    int                     rc;
    char                    *colon = NULL;
    thdfunc                 *func;
    pthread_t               *thds;
    shash_t                 *shash;

    /* Latch arg0 */
    argv0 = argv[0];

    /* Seed my rand */
    srand48( getpid() * time(NULL) );

    /* Getopt loop */
    while(-1 != (c = getopt(argc, argv, "k:S:l:h:t:i:afh")))
    {
        switch(c)
        {
            /* Set key */
            case 'k':
                key = strtol(optarg, NULL, 0);
                break;

            /* Convert to base64 and set sessionid */
            case 'S':
                sessionbase = optarg;
                break;

            /* Set low boundary */
            case 'L':
                lowbound = atoi(optarg);
                break;

            /* Set high boundary */
            case 'H':
                highbound = atoi(optarg);
                break;

            /* Set the number of threads */
            case 't':
                threadcnt = atoi(optarg);
                break;

            /* Set the number of iterations */
            case 'i':
                iterations = atoi(optarg);
                break;

            /* Set this to add mode */
            case 'a':
                mode = MODE_ADD;
                break;

            /* Set this to find mode */
            case 'f':
                mode = MODE_FIND;
                break;

            /* Usage */
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

    /* Create threads array */
    thds = calloc(sizeof(pthread_t), threadcnt);

    /* Set threadfunc */
    switch(mode)
    {
        case MODE_ADD:
            func = add_thd;
            break;

        case MODE_FIND:
            func = find_thd;
            break;

        default:
            abort();
    }

    /* Create */
    for(ii = 0 ; ii < threadcnt ; ii++)
    {
        rc = pthread_create(&thds[ii], NULL, func, NULL);
        if(rc)
        {
            perror("pthread_create");
            exit(1);
        }
    }

    /* Join */
    for(ii = 0 ; ii < threadcnt ; ii++)
    {
        pthread_join(thds[ii], NULL);
    }

    return 0;
}
