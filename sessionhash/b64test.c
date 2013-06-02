#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include "base64.h"
#include <stdlib.h>


/* Return a char array with the binary data */
static inline void b64tobinary(char *base64, int sz, char *out, int outsz, FILE *f)
{
    int cnt;
    char *outptr = out;
    int iout;

    /* Reduce sz */
    sz -= (sz % 4);

    for(cnt = 0 ; cnt < sz ; cnt += 4)
    {
        iout =  (b64int(base64[cnt])    << 18) + 
                (b64int(base64[cnt+1])  << 12) + 
                (b64int(base64[cnt+2])  << 6) + 
                (b64int(base64[cnt+3])  << 0);

        /* Copy into the outptr - not sure where to start copy */
        memcpy(outptr, &iout, 3);

        /* Increment outptr */
        outptr += 3;
    }
    outptr[0] = '\0';
    fprintf(f, "%s", out);
}

int usage(const char *a0)
{
    fprintf(stderr, "Usage %s [opts]\n", a0);
    fprintf(stderr, "   -e 'string'         - base64 encode string\n");
    fprintf(stderr, "   -d 'string'         - base64 decode string\n");
    fprintf(stderr, "   -h                  - this menu\n");
    exit(1);
}

static char *argv0;

int main(int argc, char *argv[])
{
    char *string;
    int c, len; 

    /* Save argv0 */
    argv0 = argv[0];

    while(-1 != (c = getopt(argc, argv, "e:d:h")))
    {
        switch(c)
        {
            case 'e':
                string = base64_encode(optarg, strlen(optarg), &len);
                fprintf(stdout, "%s\n", string);
                free(string);
                return;
                break;

            case 'd':
                string=base64_decode(optarg, strlen(optarg), &len);
                fprintf(stdout, "%s\n", string);
                free(string);
                return;
                break;

            case 'h':
                usage(argv0);
                break;

            default:
                usage(argv0);
                break;
        }
    }
}
