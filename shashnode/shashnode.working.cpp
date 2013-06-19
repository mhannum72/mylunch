#include <node.h>
#include "sessionhash.h"

#define MAX_SHASH_HANDLE 128

static int current = 0;
static shash_t *handles[MAX_SHASH_HANDLE];

using namespace v8;

Handle<Value> SessionhashAdd(const Arguments& args) {
    HandleScope scope;
    shash_t *shash;
    int32_t jshandle;

    //sessionhash_add(NULL, "abcd", 1234);
    //shash_t *xxx;
    
    //sessionhash_attach_cpp(1, &shash);

    if (args.Length() < 3) {
        return ThrowException(
            Exception::TypeError(String::New("Requires handle, key, and userid arguments"))
        );
    }

    Local<Integer> integer = args[0]->ToInteger();
    jshandle = integer->Value();

    if(jshandle >= current || jshandle < 0) {
        return ThrowException(
            Exception::TypeError(String::New("Invalid sessionhash handle"))
        );
    }

    // Grab handle
    shash = handles[jshandle];

    if(NULL == shash) {
        return ThrowException(
            Exception::TypeError(String::New("Null sessionhash handle")));
    }

    Local<String> st = args[1]->ToString();
    char sessionkey[128] = {0};
    st->WriteAscii(sessionkey, 0, sizeof(sessionkey), 0);
    //char *sessionkey;
    //st.WriteAscii(sessionkey, 0, sizeof(sessionkey), 0);

    // Cast away!
    Local<Integer> number = args[2]->ToInteger();
    int64_t userid = number->Value();

    int rcode = sessionhash_add(shash, sessionkey, userid);

    // Try a sessionhash attach here 
    sessionhash_attach(1);

    /*
    shash = handles[0];
    sessionhash_add(NULL, "abcd", 1234);
    */

    return scope.Close(Integer::New(rcode));
}


Handle<Value> SessionhashAttach(const Arguments& args) {
    HandleScope scope;
    shash_t *shash;
    int32_t jshandle;

    //sessionhash_add(NULL, "abcd", 1234);
    //shash_t *xxx;
    
    //sessionhash_attach_cpp(1, &shash);

    if (args.Length() < 1) {
        return ThrowException(
            Exception::TypeError(String::New("Error"))
        );
    }

    Local<Integer> integer = args[0]->ToInteger();
    jshandle = integer->Value();

    /*
    if(jshandle >= current || jshandle < 0) {
        return ThrowException(
            Exception::TypeError(String::New("Invalid sessionhash handle"))
        );
    }
    */

    // Grab handle
    /*
    shash = handles[jshandle];

    if(NULL == shash) {
        return ThrowException(
            Exception::TypeError(String::New("Null sessionhash handle")));
    }

    Local<String> st = args[1]->ToString();
    char sessionkey[128] = {0};
    st->WriteAscii(sessionkey, 0, sizeof(sessionkey), 0);
    //char *sessionkey;
    //st.WriteAscii(sessionkey, 0, sizeof(sessionkey), 0);

    // Cast away!
    Local<Integer> number = args[2]->ToInteger();
    int64_t userid = number->Value();

    int rcode = sessionhash_add(shash, sessionkey, userid);
    */

    char sessionkey[128] = {0};
    Local<String> st = args[0]->ToString();
    st->WriteAscii(sessionkey, 0, sizeof(sessionkey), 0);
    int64_t userid = 1234;

    //shash = handles[0];

    sessionhash_attach(1);
    //int rcode = sessionhash_add(NULL, NULL, 0);

    // Try a sessionhash attach here 
//    sessionhash_attach(1);





    //shash = handles[0];
    //sessionhash_add(NULL, "abcd", 1234);

    /*
    if (args.Length() < 1) {
        return ThrowException(
            Exception::TypeError(String::New("Requires a shmkey argument"))
        );
    }

    // Make sure there's room
    if(current >= MAX_SHASH_HANDLE) {
        return ThrowException(
            Exception::TypeError(String::New("Have reached the maximum shash objects"))
        );
    }
    */

    // Return the js handle 
    return scope.Close(Integer::New(jshandle));
}

void RegisterModule(Handle<Object> target) {

    target->Set(String::NewSymbol("shashattach"),
        FunctionTemplate::New(SessionhashAttach)->GetFunction());

    target->Set(String::NewSymbol("shashadd"),
        FunctionTemplate::New(SessionhashAdd)->GetFunction());

}

NODE_MODULE(shashnode, RegisterModule)
