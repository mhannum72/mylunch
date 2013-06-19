#include <node.h>
#include <sessionhash.h>

using namespace v8;

Handle<Value> SessionhashAdd(const Arguments& args) {
    HandleScope scope;
    int32_t jshandle;

    if (args.Length() < 3) {
        return ThrowException(
            Exception::TypeError(String::New("Requires handle, key, and userid arguments"))
        );
    }

    Local<Integer> integer = args[0]->ToInteger();
    jshandle = integer->Value();

    Local<String> st = args[1]->ToString();
    char sessionkey[128] = {0};
    st->WriteAscii(sessionkey, 0, sizeof(sessionkey), 0);
    //char *sessionkey;
    //st.WriteAscii(sessionkey, 0, sizeof(sessionkey), 0);

    // Cast away!
    Local<Integer> number = args[2]->ToInteger();
    int64_t userid = number->Value();

    int rcode;
    //rcode = sessionhash_add_handle(jshandle, sessionkey, userid);

    /*
    shash = handles[0];
    sessionhash_add(NULL, "abcd", 1234);
    */

    return scope.Close(Integer::New(rcode));
}


Handle<Value> SessionhashAttach(const Arguments& args) {
    HandleScope scope;
    shash_t *shash;
    int32_t shmkey, jshandle;

    //sessionhash_add(NULL, "abcd", 1234);
    //shash_t *xxx;
    
    //sessionhash_attach_cpp(1, &shash);

    if (args.Length() < 3) {
        return ThrowException(
            Exception::TypeError(String::New("Requires handle, key, and userid arguments"))
        );
    }

    Local<Integer> integer = args[0]->ToInteger();
    shmkey = integer->Value();

    //char *sessionkey;
    //st.WriteAscii(sessionkey, 0, sizeof(sessionkey), 0);

    // Cast away!
    //Local<Integer> number = args[2]->ToInteger();
    //int64_t userid = number->Value();

    //int rcode = sessionhash_add(shash, sessionkey, userid);
    // Try a sessionhash attach here 
    jshandle = sessionhash_attach_handle(shmkey);

    /*
    shash = handles[0];
    sessionhash_add(NULL, "abcd", 1234);
    */

    return scope.Close(Integer::New(jshandle));
}

void RegisterModule(Handle<Object> target) {

    target->Set(String::NewSymbol("shashattach"),
        FunctionTemplate::New(SessionhashAttach)->GetFunction());

    target->Set(String::NewSymbol("shashadd"),
        FunctionTemplate::New(SessionhashAdd)->GetFunction());

}

NODE_MODULE(shashnode, RegisterModule)
