#ifndef _SESSIONHASH_H
#define _SESSIONHASH_H

#ifndef _SESSIONHASH_INTERNAL
typedef struct sessionhash
{
    int             _x[1];
}
shash_t;
#endif

/* Create and return a sessionhash object */
shash_t *sessionhash_create(int shmkey, int nelements);

/* Attach to a sessionhash object */
shash_t *sessionhash_attach(int shmkey);

/* Attach readonly to a sessionhash object */
shash_t *sessionhash_attach_readonly(int shmkey);

/* Destroy sessionhash handle */
void sessionhash_destroy(shash_t *s);

/* Retrieve user for this session */
long long sessionhash_find(shash_t *s, char key[80]);

/* Retrieve user for this session */
int sessionhash_add(shash_t *s, char key[80], long long userid);


#endif
