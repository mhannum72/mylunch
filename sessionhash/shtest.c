#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include "sessionhash.h"

/* Default key */
#define DEFAULTKEY 0x12345678

/* Arg0 */
const char *argv0;

/* Usage menu */
void usage(const char *argv0, FILE *f)
{
    fprintf(f,  "Usage: %s <opts>\n", argv0);
    fprintf(f,  "-k <key>               - Set shmkey\n");
    fprintf(f,  "-C <count>             - Create sessionhash\n");
    fprintf(f,  "-a <sessid>:<userid>   - Add sessionid:userid\n");
    fprintf(f,  "-f <sessid>            - Find sessionid\n");
    fprintf(f,  "-s                     - Retrieve stats\n");
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
   ,MODE_STATS              = 4
};

/* Mode variable */
static int mode = MODE_UNSET;

/* Main */
int main(int argc, char *argv[])
{
    int                     c;
    int                     nelements;
    int                     err = 0;
    int                     key = DEFAULTKEY;
    char                    *addstring;
    char                    *findsession;

    /* Latch arg0 */
    argv0 = argv[0];

    while(-1 != (c = getopt(argc, argv, "k:C:a:f:sh")))
    {
        switch(c)
        {
            /* Set key */
            case 'k':
                key = atoi(optarg);
                break;

            /* Create */
            case 'C':
                mode = MODE_CREATE;
                nelements = atoi(optarg);
                break;

            /* Add */
            case 'a':
                mode = MODE_ADD;
                addstring = optarg;
                break;

            /* Find */
            case 'f':
                mode = MODE_FIND;
                findsession = optarg;
                break;

            /* Stats */
            case 's':
                mode = MODE_STATS;
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
}
