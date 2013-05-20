#include <ngx_config.h>
#include <ngx_core.h>
#include <ngx_http.h>

typedef struct {
    u_int               userid;
    u_int               mealid;
    u_int               picid;
    char                pictype[];
    ngx_flag_t          enable;
} ngx_http_imgauth_loc_conf_t;


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

static char *ngx_http_imgauth(ngx_conf_t *cf, ngx_command_t *cmd, void *conf)
{
    ngx_http_core_loc_conf_t *clcf;
    ngx_http_imgauth_loc_conf_t *cglcf = conf;


}

static char *
ngx_http_imgauth_merge_loc_conf(ngx_conf_t *cf, void *parent, void *child)
{
    ngx_http_imgauth_loc_conf_t *prev = parent;
    ngx_http_imgauth_loc_conf_t *conf = child;

    if(conf->enable)
        /* init lots of stuff */;

    return NGX_CONF_OK;
}

