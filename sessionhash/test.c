#include <stdio.h>
#include <pthread.h>
#include <sys/ipc.h>
#include <sys/shm.h>

#define ITER 10
#define THDS 1
#define MAXSLEEP 5
#define SHKEY 0x123456

typedef struct lkstruct
{
    pthread_mutex_t         lk;
}
locks_t;

locks_t *sharedlk = NULL;

// pthread_mutex_t lk = PTHREAD_MUTEX_INITIALIZER;

void *thd(void *a)
{
    int i;
    for(i = 0 ; i < ITER ; i++)
    {
        pthread_mutex_lock(&sharedlk->lk);
        int x = (int)pthread_self();
        fprintf(stderr, "process %d thread %d got the lock\n", getpid(), x);
        sleep(rand() % MAXSLEEP);
        fprintf(stderr, "process %d thread %d releaseing the lock\n", getpid(), x);
        fflush(stderr);
        pthread_mutex_unlock(&sharedlk->lk);
        sleep(1);
    }
}

int main()
{
    int i, rc, shmid;
    pthread_t thds[THDS];


    /* We're running for the first time - create it */
    pthread_mutexattr_t attr;

    rc = pthread_mutexattr_init(&attr);
    if(rc) 
    {
        perror("pthread_mutexattr_init");
        exit(1);
    }

    rc = pthread_mutexattr_setpshared(&attr, PTHREAD_PROCESS_SHARED);
    if(rc) 
    {
        perror("pthread_mutexattr_setpshared");
        exit(1);
    }


    shmid = shmget(SHKEY, 1024, IPC_CREAT|IPC_EXCL|0666);
    if(-1 != shmid)
    {
        sharedlk = (locks_t *)shmat(shmid, NULL, 0);
        if(-1 == sharedlk)
        {
            perror("shmat");
            exit(1);
        }

        rc = pthread_mutex_init(&sharedlk->lk, &attr);
        if(rc)
        {
            perror("pthread_mutex_init");
            exit(1);
        }
    }
    else
    {
        shmid = shmget(SHKEY, 1024, 0);
        sharedlk = (locks_t *)shmat(shmid, NULL, 0);
        if(-1 == sharedlk)
        {
            perror("shmat");
            exit(1);
        }
    }

    for(i=0;i<THDS;i++)
    {
        rc = pthread_create(&thds[i], NULL, thd, (void *)i);
        if(rc)
        {
            perror("pthread_create");
        }
    }

    while(1) sleep(1);
}
