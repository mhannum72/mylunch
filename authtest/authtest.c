#include <stdio.h>
#include <signal.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>
#include "hiredis.h"
#include "async.h"
#include "adapters/libevent.h"

static char *argv0;

int usage(FILE *f)
{
    fprintf(f, "Usage: %s <args>\n", argv0);
    fprintf(f, "    -c <cookie>             - set cookie\n");
    fprintf(f, "    -p <path>               - set path\n");
    exit(1);
}

void getCallback(redisAsyncContext *c, void *r, void *privdata) 
{
    char *useridstr;
    int64_t userid = 0;
    redisReply *reply = r;
    if (reply == NULL) 
    {
        /* Do something intellegent .. send a can't find picture maybe */
        return;
    }

    /* Dumb way to find userid */
    useridstr = strstr(reply->str, "\"userid\":");

    if(useridstr)
    {
        userid = atoll(useridstr + 9);
        printf("%s -> %lld\n", (char*)privdata, userid);
    }
    else
    {
        printf("%s -> %s\n", (char*)privdata, reply->str);
    }

    /* Disconnect after receiving the reply to GET */
    redisAsyncDisconnect(c);
}

void connectCallback(const redisAsyncContext *c, int status) 
{
    if (status != REDIS_OK) 
    {
//        printf("Error: %s\n", c->errstr);
        return;
    }
    //printf("Connected...\n");
}

void disconnectCallback(const redisAsyncContext *c, int status) 
{
    if (status != REDIS_OK) 
    {
        printf("Error: %s\n", c->errstr);
        return;
    }
    //printf("Disconnected...\n");
}

int main(int argc, char *argv[])
{
    int c, err=0;
    char *cookie=NULL;
    char *path=NULL;
    char rediscmd[80];
    struct event_base *base;
    redisAsyncContext *ctxt;

    /* Get argv0 */
    argv0 = argv[0];

    /* Ignore sigpipe */
    signal(SIGPIPE, SIG_IGN);

    /* Process args */
    while( -1 != ( c = getopt(argc, argv, "c:p:")))
    {
        switch(c)
        {
            case 'c':
                cookie=optarg;
                break;
            case 'p':
                path=optarg;
                break;
            default:
                fprintf(stderr, "Unknown argument, '%c'.\n", c);
                err++;
                break;
        }
    }

    /* Check that cookie is set */
    if(!cookie)
    {
        fprintf(stderr, "Cookie is not set\n");
        err++;
    }

    /* Check that path is set */
    if(!path)
    {
        fprintf(stderr, "Path is not set\n");
        err++;
    }

    /* Exit on err */
    if(err) usage(stderr);

    /* Lib event */
    base = event_base_new();

    /* Connect to local redis server */
    ctxt = redisAsyncConnect("127.0.0.1", 6379);
    if (!ctxt || ctxt->err)
    {
        fprintf(stderr, "Error on redis async connect.\n");
        if(ctxt) fprintf(stderr, "%s\n", ctxt->errstr);
        exit(1);
    }

    redisLibeventAttach(ctxt, base);
    redisAsyncSetConnectCallback(ctxt,connectCallback);
    redisAsyncSetDisconnectCallback(ctxt,disconnectCallback);
    snprintf(rediscmd, sizeof(rediscmd), "GET %s", cookie);
    redisAsyncCommand(ctxt, getCallback, (char*)cookie, rediscmd);
    event_base_dispatch(base);
    return 0;
}
