// Mongo handle
var mongo = require('mongodb'),
    db = new mongo.Db('mylunch', new mongo.Server('localhost', 27017, { auto_reconnect: true }));

var testtable = 'mytest';
var dupkeymessage = 'E11000';

getCollection = function(coll, callback) {
    db.collection(coll, function(error, collection) {
        if(error) callback(error);
        else callback(null, collection);
    });
}

// Open Mongo
db.open(function(error, client){
    if (error) throw error;
    
    // Create indexes for users.  Use this to store information about the user. 
    // Usernames can change, but a userid cannot.
    db.collection(testtable, function(error, collection) {
        collection.ensureIndex({testix:1},{unique:true});
    });

    // Insert a record into this database
    getCollection(testtable, function(error, testcol) {
        if(error) throw (error);
        var newrec = { testix : 1, username : 'mark' };
       // try {
            testcol.insert(newrec, {safe: true}, function(err, object) {
                if(err) {
                    // .. this seems to work ..
                    if(err.message.substr(0, 6) == dupkeymessage) {
                        console.log('Got a dup key from mongo:' + err);
                    }
                    else {
                        throw(err);
                    }
                }
            });
       // }
       /*
        catch(err)
        {
            if(err.message.substr(0, 6) == dupkeymessage) {
                console.log('Got a dup key from mongo:' + err);
            }
            else {
                throw(err);
            }
        }
        */
        /*
            testcol.insert(newrec, {safe: true}, function(err, object) {
                if(err) throw(err);
                console.log('made it here?');
                testcol.find(newrec, function(err, results) {
                    results.each(function(err2, myrecord) {
                        console.log('found result');
                    });
                });
            });
            */
       // });
    });
});



// lets try to find
/*
getCollection(testtable, function(err, testcol) {
    if(err) throw(err);
    testcol.find( {testix:1}, function(error,  results) {
        if(error) throw(error);
        results.each(function(err2, myrecord) {
            console.log('found result');
        });
    });
});
*/


