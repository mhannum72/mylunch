authtest:	authtest.c
	gcc $< -o $@ -Ihiredis/ hiredis/libhiredis.a -levent

clean:
	rm authtest
