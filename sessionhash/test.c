#include <stdlib.h>
#include <unistd.h>
#include <stdio.h>
#include <pthread.h>
#include <sys/ipc.h>
#include <sys/shm.h>

//#define SHKEY 0x123456

enum
{
    UNSET_MODE              = 0
   ,READ_MODE               = 1
   ,WRITE_MODE              = 2
};

int iterations = 10;
int maxsleep = 5;
int numthds = 5;
int mode = UNSET_MODE;
int shmkey = 0x123456;

typedef struct lkstruct
{
    pthread_rwlock_t        lk;
}
locks_t;

static char *argv0;

void usage(FILE *f)
{
    fprintf(f, "Usage: %s [opts]\n", argv0);
    fprintf(f, "    -r              - Read mode.\n");
    fprintf(f, "    -w              - Write mode.\n");
    fprintf(f, "    -k <key>        - Set shmkey.\n");
    fprintf(f, "    -t <numthds>    - Number of threads.\n");
    fprintf(f, "    -i <iterations> - Number of threads.\n");
    fprintf(f, "    -h              - This menu.\n");
    exit(1);
}

locks_t *sharedlk = NULL;

void *writethd(void *a)
{
    int i;
    for(i = 0 ; i < iterations ; i++)
    {
        pthread_rwlock_wrlock(&sharedlk->lk);
        int x = (int)pthread_self();
        fprintf(stderr, "process %d thread %d got the write lock\n", getpid(), x);
        sleep(rand() % maxsleep);
        fprintf(stderr, "process %d thread %d releasing the write lock\n", getpid(), x);
        fflush(stderr);
        pthread_rwlock_unlock(&sharedlk->lk);
        sleep(1);
    }
}


void *readthd(void *a)
{
    int i;
    for(i = 0 ; i < iterations ; i++)
    {
        pthread_rwlock_rdlock(&sharedlk->lk);
        int x = (int)pthread_self();
        fprintf(stderr, "process %d thread %d got the read lock\n", getpid(), x);
        sleep(rand() % maxsleep);
        fprintf(stderr, "process %d thread %d releasing the read lock\n", getpid(), x);
        fflush(stderr);
        pthread_rwlock_unlock(&sharedlk->lk);
        sleep(1);
    }
}

int main(int argc, char *argv[])
{
    int i, rc, shmid, c;
    pthread_t *thds;

    argv0 = argv[0];

    while(-1 != (c = getopt(argc, argv, "rwk:t:i:h")))
    {
        switch(c)
        {
            case 'r':
                mode = READ_MODE;
                break;

            case 'w':
                mode = WRITE_MODE;
                break;

            case 't':
                numthds = atoi(optarg);
                break;

            case 'i':
                iterations = atoi(optarg);
                break;

            case 'k':
                shmkey = strtol(optarg, NULL, 0);
                break;

            default:
                fprintf(stderr, "Unknown option, '%c'\n", c);
                break;
        }
    }

    if(mode == UNSET_MODE)
    {
        fprintf(stderr, "Mode is unset\n");
        usage(stderr);
    }

    /* We're running for the first time - create it */
    pthread_rwlockattr_t attr;

    rc = pthread_rwlockattr_init(&attr);
    if(rc) 
    {
        perror("pthread_mutexattr_init");
        exit(1);
    }

    rc = pthread_rwlockattr_setpshared(&attr, PTHREAD_PROCESS_SHARED);
    if(rc) 
    {
        perror("pthread_mutexattr_setpshared");
        exit(1);
    }

    rc = pthread_rwlockattr_setkind_np(&attr, PTHREAD_RWLOCK_PREFER_WRITER_NONRECURSIVE_NP);
    if(rc) 
    {
        perror("pthread_mutexattr_setkind_np");
        exit(1);
    }

    shmid = shmget(shmkey, 1024, IPC_CREAT|IPC_EXCL|0666);
    if(-1 != shmid)
    {
        sharedlk = (locks_t *)shmat(shmid, NULL, 0);
        if(-1 == (int)sharedlk)
        {
            perror("shmat");
            exit(1);
        }

        rc = pthread_rwlock_init(&sharedlk->lk, &attr);
        if(rc)
        {
            perror("pthread_mutex_init");
            exit(1);
        }
    }
    else
    {
        shmid = shmget(shmkey, 1024, 0);
        sharedlk = (locks_t *)shmat(shmid, NULL, 0);
        if(-1 == (int)sharedlk)
        {
            perror("shmat");
            exit(1);
        }
    }

    thds = calloc(sizeof(pthread_t),numthds);

    for(i=0;i<numthds;i++)
    {
        if(READ_MODE == mode)
            rc = pthread_create(&thds[i], NULL, readthd, (void *)i);
        else
            rc = pthread_create(&thds[i], NULL, writethd, (void *)i);

        if(rc)
            perror("pthread_create");
    }

    for(i=0;i<numthds;i++)
    {
        pthread_join(thds[i], NULL);
    }
}
