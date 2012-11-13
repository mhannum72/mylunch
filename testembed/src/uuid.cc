#include <cstring>
#include <v8.h>
#include <node.h>

using namespace v8;
using namespace node;

namespace uuid_v8 {

Handle<Value> Generate( const Arguments &args ) {
    static int lastuuid = 0;
    HandleScope scope;
    return Int32::New(lastuuid++);
}

}

extern "C"
void init( Handle<Object> target ) {
    HandleScope scope;
    Local<FunctionTemplate> t = FunctionTemplate::New(uuid_v8::Generate);

    target->Set(String::NewSymbol( "generate" ), t->GetFunction() );
}

