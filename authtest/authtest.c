#include <stdio.h>
#include <signal.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>
#include "hiredis.h"
#include "async.h"
#include "bson.h"
#include "mongo.h"
#include "adapters/libevent.h"

/* Arrrrrrg-v */
static char *argv0;

/* Hold the request state */
typedef struct req_state
{
    char cookie[120];
    char path[120];
    int64_t path_userid;
}
req_state_t;

/* Usage */
int usage(FILE *f)
{
    fprintf(f, "Usage: %s <args>\n", argv0);
    fprintf(f, "    -c <cookie>             - set cookie\n");
    fprintf(f, "    -p <path>               - set path\n");
    exit(1);
}

/* Extract the userid from the path */
static inline int useridfrompath(const char *path, int64_t *userid)
{
    /* The path looks like this: <type>/<userid>/<pictureid> */
    char *p;
    
    /* Find first slash */
    if( ! ( p = strchr(path, '/') ) )
    {
        return -1;
    }

    /* Convert to long long */
    *userid = atoll(&p[1]);

    return 0;
}

/* Extract the userid from the session */
static inline int useridfromsession(const char *sess, int64_t *userid)
{
    char *useridstr;

    /* No json parsing - just do a strstr */
    useridstr = strstr(sess, "\"userid\":");

    /* Convert and return */
    if(useridstr)
    {
        *userid = atoll(useridstr + 9);
        return 0;
    }
    return -1;
}


/* Found the cookie */
void redis_find_cookie_callback(redisAsyncContext *c, void *r, void *privdata) 
{
    int64_t session_userid = -1;
    int showpic = 0;
    int public = 0;

    /* My redis reply */
    redisReply *reply = r;

    /* Working rstate */
    req_state_t *rstate = (req_state_t *)privdata;

    /* Get the userid from the path */
    if (reply != NULL && 0 == useridfromsession(reply->str, &session_userid) &&
            session_userid == rstate->path_userid) 
    {
        showpic = 1;
    }

    /* We can show the picture */
    fprintf(stderr, "Session user %lld is %s to see %s public = %d\n", 
            session_userid, (showpic ? "allowed" : "not-allowed"), rstate->path,
            public);

    /* Disconnect after receiving the reply to GET */
    redisAsyncDisconnect(c);
}

/* Boilerplace connect callback for redis */
void redis_connect_callback(const redisAsyncContext *c, int status) 
{
    if (status != REDIS_OK) 
    {
        fprintf(stderr, "%s line %d: error connecting to redis: %s\n", 
                __func__, __LINE__, c->errstr);
        return;
    }
}

/* Boilerplace disconnect callback for redis */
void redis_disconnect_callback(const redisAsyncContext *c, int status) 
{
    if (status != REDIS_OK) 
    {
        fprintf(stderr, "%s line %d: error disconnecting from redis: %s\n", 
                __func__, __LINE__, c->errstr);
        return;
    }
}

int main(int argc, char *argv[])
{
    int c, err=0;
    int64_t path_userid;
    char *cookie=NULL;
    char *path=NULL;
    char rediscmd[80];
    req_state_t *rstate;
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

    /* Attach redis to libevent */
    redisLibeventAttach(ctxt, base);
    
    /* Invoke this when redis connects */
    redisAsyncSetConnectCallback(ctxt, redis_connect_callback);

    /* Invoke this when redis disconnects */
    redisAsyncSetDisconnectCallback(ctxt, redis_disconnect_callback);

    /* Allocate a req_state */
    rstate = (req_state_t *)malloc(sizeof(*rstate));

    /* Copy in cookie */
    strncpy(rstate->cookie, cookie, sizeof(rstate->cookie));

    /* Copy in path */
    strncpy(rstate->path, path, sizeof(rstate->path));

    /* Get the userid from the path */
    if(0 == useridfrompath(rstate->path, &path_userid))
    {
        /* Set the path userid */
        rstate->path_userid = path_userid;

        /* Redis command */
        snprintf(rediscmd, sizeof(rediscmd), "GET %s", rstate->cookie);

        /* Get this from redis */
        redisAsyncCommand(ctxt, redis_find_cookie_callback, (char*)rstate, rediscmd);

        /* Libevent event handler */
        event_base_dispatch(base);
    }

    /* Error - this needs to go somewhere else */
    else
    {
    }

    return 0;
}
