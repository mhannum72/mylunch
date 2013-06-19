var shash = require('./build/Release/shashnode');

var key = parseInt('0x1234', 16);
var handle = shash.shashattach(key);
console.log('handle is ' + handle);
var rcode = shash.shashadd(handle, 'aGVsbG8=', 1234);

console.log('sessionhashadd rcode is  ' + rcode);
