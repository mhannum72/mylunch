CFLAGS=-g

LIBS=-lpthread

%.o : %.c
	$(CC) -c $(CFLAGS) $< -o $@ 

shtest:	sessionhash.o base64.o shtest.o
	$(CC) $(CFLAGS) -o $@ $^ $(LIBS)
	
clean:
	-rm -f shtest *.o
