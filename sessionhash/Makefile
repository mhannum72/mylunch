CFLAGS=-g

PTHREADLIBS=-lpthread

LIBS=-L. -lsessionhash $(PTHREADLIBS)

AR=/usr/bin/ar

all: shashutil shashtest test

test:	test.o
	$(CC) $(CFLAGS) -o $@ $< $(PTHREADLIBS)

shashutil:	shashutil.o libsessionhash.a
	$(CC) $(CFLAGS) -o $@ $< $(LIBS)

shashtest: shashtest.o libsessionhash.a
	$(CC) $(CFLAGS) -o $@ $< $(LIBS)

%.o : %.c
	$(CC) -c $(CFLAGS) $< -o $@ 

libsessionhash.a: sessionhash.o base64.o
	$(AR) rcs $@ $^ 

clean:
	-rm -f shashutil *.o *.a
