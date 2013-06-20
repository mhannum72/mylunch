// Load shash module
var shash = require('./build/Release/shashnode');

// Formulate hash key
var key = parseInt('0x1234', 16);

// Attach to sessionhash
var handle = shash.attach(key);

// Common prefix
var prefix = "aabbcc";

// A gb
var gb = (1024 * 1024 * 1024 * 2);

// Throw exception if this is bad
if(handle < 0) {
    throw new Error("Error attaching to handle with key " + key);
}

// Loop
for(var ii = 0 ; ii < 10 ; ii++) {

    var sessionid = prefix + ii;
    var rcode = shash.add(handle, sessionid, ii * gb);
    if(rcode != 0) {
        console.log("Error adding " + sessionid + ": rcode = " + rcode);
    }
}

// Find these
for(var ii = 0 ; ii < 10 ; ii++) {
    var sessionid = prefix + ii;
    var rcode = shash.find(handle, sessionid);
    console.log("Sessionid " + sessionid + " value " + rcode);
}

// Delete a few
for(var ii = 0 ; ii < 10 ; ii+=2) {
    var sessionid = prefix + ii;
    var rcode = shash.delete(handle, sessionid);
    if(rcode != 0) {
        console.log("Error deleting " + sessionid + ": rcode = " + rcode);
    }
    else {
        console.log("Deleted sessionid " + sessionid);
    }
}

// Find again
for(var ii = 0 ; ii < 10 ; ii++) {
    var sessionid = prefix + ii;
    var rcode = shash.find(handle, sessionid);
    console.log("Sessionid " + sessionid + " value " + rcode);
}

