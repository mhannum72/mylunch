#include <ngx_config.h>
#include <ngx_core.h>
#include <ngx_http.h>

typedef struct 
{
    /* Base directory to search for this picture */
    ngx_str_t           image_base;

    /* IP for redis.  This should default to 127.0.0.1.  */
    ngx_str_t           redis_ip;

    /* Port for redis.  This should default to 6379. */
    u_int               redis_port;

    /* Set to 1 if enabled */
    ngx_flag_t          enable;

    /* These do not go in here */
#if 0
    /* Type of picture as read from it's information file */
    ngx_str_t           pictype;

    /* Cookie defining session associated with this user */
    ngx_str_t           cookie;

    /* Userid associated with session */
    u_int               userid;

    /* Meal associated with session */
    u_int               mealid;

    /* Requested picture id */
    u_int               picid;

    /* Redis async context to make calls against server */
    redisAsyncContext   *ctxt;

    /* Redis sync contect */
#endif

} 
ngx_http_imgauth_loc_conf_t;


static ngx_http_module_t  ngx_http_imgauth_module_ctx = {
    NULL,                          /* preconfiguration */
    NULL,           /* postconfiguration */

    NULL,                          /* create main configuration */
    NULL,                          /* init main configuration */

    NULL,                          /* create server configuration */
    NULL,                          /* merge server configuration */

    ngx_http_imgauth_create_loc_conf,  /* create location configuration */
    ngx_http_imgauth_merge_loc_conf /* merge location configuration */
};


static ngx_command_t  ngx_http_imgauth_commands[] = {
    { ngx_string("imgauth"),
      NGX_HTTP_LOC_CONF|NGX_CONF_NOARGS,
      ngx_http_imgauth,
      NGX_HTTP_LOC_CONF_OFFSET,
      0,
      NULL },

    { ngx_string("redis_ip"),
      NGX_HTTP_LOC_CONF|NGX_CONF_NOARGS,
      ngx_conf_set_str_slot,
      NGX_HTTP_LOC_CONF_OFFSET,
      offsetof(ngx_http_imgauth_loc_conf_t, redis_ip),
      NULL },

    { ngx_string("redis_ip"),
      NGX_HTTP_LOC_CONF|NGX_CONF_NOARGS,
      ngx_conf_set_str_slot,
      NGX_HTTP_LOC_CONF_OFFSET,
      offsetof(ngx_http_imgauth_loc_conf_t, redis_ip),
      NULL },

    { ngx_string("redis_port"),
      NGX_HTTP_LOC_CONF|NGX_CONF_NOARGS,
      ngx_conf_set_num_slot,
      NGX_HTTP_LOC_CONF_OFFSET,
      offsetof(ngx_http_imgauth_loc_conf_t, redis_port),
      NULL },

    { ngx_string("image_base"),
      NGX_HTTP_LOC_CONF|NGX_CONF_NOARGS,
      ngx_conf_set_str_slot,
      NGX_HTTP_LOC_CONF_OFFSET,
      offsetof(ngx_http_imgauth_loc_conf_t, image_base),
      NULL },

      ngx_null_command
};
 

ngx_module_t  ngx_http_imgauth_module = {
    NGX_MODULE_V1,
    &ngx_http_imgauth_module_ctx, /* module context */
    ngx_http_imgauth_commands,      /* module directives */
    NGX_HTTP_MODULE,               /* module type */
    NULL,                          /* init master */
    NULL,                          /* init module */
    NULL,                          /* init process */
    NULL,                          /* init thread */
    NULL,                          /* exit thread */
    NULL,                          /* exit process */
    NULL,                          /* exit master */
    NGX_MODULE_V1_PADDING
};

static char *
ngx_http_imgauth(ngx_conf_t *cf, ngx_command_t *cmd, void *conf)
{
    ngx_http_core_loc_conf_t *clcf;
    ngx_http_imgauth_loc_conf_t *cglcf = conf;

    /* Grab the global loc config structure */
    clcf = ngx_http_conf_get_module_loc_conf(cf, ngx_http_core_module);
    
    /* Set the handler method */
    clcf->handler = ngx_http_imgauth_handler;

    /* We are enabled */
    cglcf->enable = 1;

    return NGX_CONF_OK;
}

static ngx_int_t
ngx_http_imgauth_init(ngx_http_imgauth_loc_conf_t *cglcf);
{
}

static char *
ngx_http_imgauth_merge_loc_conf(ngx_conf_t *cf, void *parent, void *child)
{
    ngx_http_imgauth_loc_conf_t *prev = parent;
    ngx_http_imgauth_loc_conf_t *conf = child;

    /* Default the image base to "/data/users" if unset */
    ngx_conf_merge_str_value(conf->image_base, parent->image_base, "/data/users");

    /* Default the redis ip to localhost if unset */
    ngx_conf_merge_str_value(conf->redis_ip, parent->redis_ip, "127.0.0.1");

    /* Default the redis port to 6379 if unset */
    ngx_conf_merge_uint_value(conf->redis_port, parent->redis_port, 6379);

    /* Setting 'imgauth' enables this */
    if(conf->enable)
    {
        /* Create a redis connection!  */
        ngx_http_imgauth_init(conf);
    }

    return NGX_CONF_OK;
}

static void *
ngx_http_imgauth_create_loc_conf(ngx_conf_t *cf)
{
    ngx_http_imgauth_loc_conf_t *conf;

    conf = ngx_pcalloc(cf->pool, sizeof(ngx_http_imgauth_loc_conf_t));
    if(conf == NULL)
        return NGX_CONF_ERROR;

    return conf;
}





