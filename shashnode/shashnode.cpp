#include <node.h>
#include "sessionhash.h"

using namespace v8;

Handle<Value> SessionhashDelete(const Arguments& args) {
    HandleScope scope;
    int32_t jshandle;

    if (args.Length() < 2) {
        return ThrowException(
            Exception::TypeError(String::New("Requires handle, key, and userid arguments"))
        );
    }

    Local<Integer> integer = args[0]->ToInteger();
    jshandle = integer->Value();

    Local<String> st = args[1]->ToString();
    char sessionkey[128] = {0};
    st->WriteAscii(sessionkey, 0, sizeof(sessionkey), 0);

    int rcode;
    rcode = sessionhash_delete_handle(jshandle, sessionkey);

    return scope.Close(Integer::New(rcode));
}


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

    // Cast away!
    Local<Integer> number = args[2]->ToInteger();
    int64_t userid = number->Value();

    int rcode;
    rcode = sessionhash_add_handle(jshandle, sessionkey, userid);

    return scope.Close(Integer::New(rcode));
}


Handle<Value> SessionhashFind(const Arguments& args) {
    HandleScope scope;
    int32_t jshandle;

    if (args.Length() < 2) {
        return ThrowException(
            Exception::TypeError(String::New("Requires handle and key arguments"))
        );
    }

    Local<Integer> integer = args[0]->ToInteger();
    jshandle = integer->Value();

    Local<String> st = args[1]->ToString();
    char sessionkey[128] = {0};
    st->WriteAscii(sessionkey, 0, sizeof(sessionkey), 0);

    int64_t rcode;
    rcode = sessionhash_find_handle(jshandle, sessionkey);

    return scope.Close(Number::New(rcode));
}



Handle<Value> SessionhashAttach(const Arguments& args) {
    HandleScope scope;
    int32_t shmkey, jshandle;

    if (args.Length() < 1) {
        return ThrowException(
            Exception::TypeError(String::New("Requires handle, key, and userid arguments"))
        );
    }

    Local<Integer> integer = args[0]->ToInteger();
    shmkey = integer->Value();

    // Try a sessionhash attach here 
    jshandle = sessionhash_attach_handle(shmkey);

    return scope.Close(Integer::New(jshandle));
}

void RegisterModule(Handle<Object> target) {

    target->Set(String::NewSymbol("attach"),
        FunctionTemplate::New(SessionhashAttach)->GetFunction());

    target->Set(String::NewSymbol("add"),
        FunctionTemplate::New(SessionhashAdd)->GetFunction());

    target->Set(String::NewSymbol("delete"),
        FunctionTemplate::New(SessionhashDelete)->GetFunction());

    target->Set(String::NewSymbol("find"),
        FunctionTemplate::New(SessionhashFind)->GetFunction());
}

NODE_MODULE(shashnode, RegisterModule)
