#include <stdio.h>
#include <pthread.h>

#define ITER 10
#define THDS 5
#define MAXSLEEP 5

pthread_mutex_t lk = PTHREAD_MUTEX_INITIALIZER;

void *thd(void *a)
{
    int i;
    for(i = 0 ; i < ITER ; i++)
    {
        pthread_mutex_lock(&lk);
        int x = (int)pthread_self();
        fprintf(stderr, "Thread %d got the lock\n", x);
        sleep(rand() % MAXSLEEP);
        fprintf(stderr, "Thread %d releaseing the lock\n", x);
        fflush(stderr);
        pthread_mutex_unlock(&lk);
        sleep(1);
    }
}

int main()
{
    int i, rc;
    pthread_t thds[THDS];

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
