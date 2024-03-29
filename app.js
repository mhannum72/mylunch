/* TODO 
 * Modularize this stuff
 * Edit userinfo page
 * Finish Admin pages
 * Come up with a scheme for displaying public photos (prolly copy it to a different table ..
 *     Yes!  This would be racy, but the way around it is to always create a new mealinfo with
 *     whatever is POSTED from the admin review page rather than hitting the database again.
 *     (hitting the database again is the 'race' part).

/**
 * Module dependencies.
 */

// Search for memory leaks
//var nodetime = require('nodetime').profile();
/*
require('nodetime').profile({
    accountKey: '499a83b95024e2eb05488f7973e133c53d43593f', 
    appName: 'Node.js Application'
  });
*/

// Enable debugging
var debug = 1;
var deletetrace = 0;

// Constant
var msPerSecond = 1000;

// Boilerplate modules
var express = require('express');
var fs = require('fs');
var util = require('util');
// var geoip = require('geoip');
//var city = new geoip.City('geolitecity/GeoLiteCity.dat');

// forget zlib (its slow).  if im gonna compress i'll use lz4
// var zlib = require('zlib');

// Image manipulation 
var im = require('imagemagick');

// Maximum pictures per meal
var defaultMaxPicsPerMeal = 128;

// Pause artificially before returning pictures 
var clientpiclatencytest = false;
var clientpiclatencyms = 5000;

// Print a message for returning pictures
var clientpictrace = false;

// Scale variables
var maxMealWidth = 780;
var maxMealHeight = 780;
var maxThumbWidth = 300;
var maxThumbHeight = 300;

// Icon image of 100 seems reasonable
var maxIconWidth = 100;
var maxIconHeight = 100;

var directorymode = 0777;

// Maximum meals on editpage
var maxMealsPerPage = 25;

// Maximum poll time waiting for deletes
var maxDeletePollTime = 1 * msPerSecond;

// Throttle updates to tmpReviews
var tmpReviewUpdateMs = 10 * msPerSecond;

// info can only be updated once every second
var infoUpdateMs = 1 * msPerSecond;

// position can only be updated once every 10 seconds
var posUpdateMs = 5 * msPerSecond;

// user pictures base directory
var basedirectory = '/data/users';

// log file
var logfilename = '/data/mylunch.log';

var log = null;

var webPort = 3000;
var webBase = 'localhost:' + webPort;

// I have to enum my meals so that they sort correctly in the database
var NOMEAL = 0;
var BREAKFAST = 1;
var LUNCH = 2;
var DINNER = 3;
var SNACK = 4;
var OTHER = 5;
var MAXMEAL = 99;

var nomealpic = null;
var favicon = null;
var notfoundpic = null;
var notfoundthumb = null;

var redispiccache = true;

// Tried async thumbs: it's more efficient to go inline.  
// TODO: Find or write a faster image-resizer.
var org = 'mylunch.org';

// Mongo error for dupkey
var dupkeystr = 'E11000';

// Offset to index 
var dupidxoffset = 36;

// Simulate a missing thumb
var simulatemissingthumb = false;

// Logging function
function wrlog(log, string, toconsole) {

    // Return immediately if there's no log
    if(!log) return;

    // Get current time
    var ts = new Date();
    var month = ts.getMonth() + 1;
    var date = ts.getDate();
    var year = ts.getFullYear();
    var hours = ts.getHours();
    var mins = ts.getMinutes();
    var secs = ts.getSeconds();

    if(month < 10)  month = '0' + month;
    if(date < 10)   date = '0' + date;
    if(hours < 10)  hours = '0' + hours;
    if(mins < 10)   mins = '0' + mins;
    if(secs < 10)   secs = '0' + secs;

    // Generate timestamp string
    var tstamp = year + '/' + month + '/' + date + ' ' + hours + ':' + 
        mins + ':' + secs + ' ';
    
    // Write to logfile adding a newline
    log.write(tstamp + string + "\n");

    // Additionally write to console
    if(toconsole) {
        console.log(string);
    }
}


// Return true if this was a dup-key error
function dupkeyerror(err) {
    if(err.message.substr(0, 6) == dupkeystr) {
        return err.message.substr(dupidxoffset).split(' ')[0];
    }
    return false;
}

// Mongo handle
var mongo = require('mongodb'),
    db = new mongo.Db('mylunch', new mongo.Server('localhost', 27017, { auto_reconnect: true }));

// Open Mongo
db.open(function(error, client){
    // We cant recover from this
    if (error) throw error;
    
    // Create indexes for users.  Use this to store information about the user. 
    // Usernames can change, but a userid cannot.
    db.collection('users', function(error, collection) {
        collection.ensureIndex({username:1},{unique:true});
        collection.ensureIndex({userid:1},{unique:true});
    });

    // Create indexes for mealInfo
    db.collection('mealInfo', function(error, collection) {
        // collection.ensureIndex({username:1, userid:1}
        collection.ensureIndex({userid:1, timestamp:1},{unique:true});
        // collection.ensureIndex({timestamp:1, worldViewable: 1, verifiedByAdmin:1, adminAllow:1});
        // collection.ensureIndex({restaurantId: 1});
        collection.ensureIndex({userid: 1, deleted: 1, whenDeleted: 1});
        collection.ensureIndex({userid: 1, mealDate:1, timestamp:1},{unique:true});
    });

    // Create indexes for mealPics
    db.collection('mealPics', function(error, collection) {
        collection.ensureIndex({userid:1, timestamp:1},{unique:true});
    });

    // Create indexes for mealThumbs
//    db.collection('mealThumbs', function(error, collection) {
//        collection.ensureIndex({userid:1, timestamp:1},{unique:true});
//    });

    // Create indexes for mealIcons
//    db.collection('mealIcons', function(error, collection) {
//        collection.ensureIndex({userid:1, timestamp:1},{unique:true});
//    });

    // Create indexes for restaurants table
    db.collection('restaurants', function(error, collection) {
        collection.ensureIndex({restaurantId:1}, {unique:true});
    });
});


// Retrieve client IP
function getClientIp(req) {
    var ipAddress;
    var forwardedIpsStr = req.header('x-forwarded-for');
    if(forwardedIpsStr){
        var forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    if(!ipAddress){
        ipAddress = req.connection.remoteAddress;
    }
    return ipAddress;
};

// Generic function to get a collection
getCollection = function(coll, callback) {
    db.collection(coll, function(error, collection) {
        if(error) callback(error);
        else callback(null, collection);
    });
}

// Create a new user object & set default attributes.
function User(username, password, userid) {
    
    // TODO create a unique-id: 
    // timestamp + dupcount + machine-that-generated-it?
    this.userid = userid;
    this.username = username;
    this.password = password;
    this.createDate = Date.now();
    this.lastUpdated = this.createDate;
    this.lastUpdatedBy = "";
    this.lastLogin = this.createDate;
    this.firstName = "";
    this.middleName = "";
    this.lastName = "";
    this.suffixName = "";
    this.addressStreet = "";
    this.addressCity = "";
    this.addressState = "";
    this.addressZip = "";
    this.addressCountry = "";
    this.phone = "";

    // There's a max-pics per meal
    // Maybe rate-limit the number of meals posted?
    this.numPics = 0;
    this.numMeals = 0;
    this.maxMeals = 10;
    this.showMealsPerPage = 9;
    this.maxPicsPerMeal = defaultMaxPicsPerMeal;
    this.isAdmin = false;
    this.lastIp = "";
    this.lastGeo = 0;
    this.lastLatitude = 0;
    this.lastLongitude = 0;
}

// TODO: A database table which contains machine mappings
// when there's more than one machine, I can add that here
// and use dupcount rather than random
function generateUniqueUserId(username, password) {
    return (Date.now() * 1000) + Math.floor(Math.random() % 1000);
}

// Recursive function to add 
addNewUserToTable = function(userTable, username, password, callback, count, max) {

    // Get a unique id
    var uniqueid = generateUniqueUserId(username, password);

    // Create a user
    var user = new User(username, password, uniqueid);

    // Try to insert
    userTable.insert(user, {safe:true}, function( err, object ) {

        // Exceeded max count
        if( err && ( count >= max ) ) {

            callback( err );

            // Write to logfile
            wrlog(log, "Failed to add user " + username + " after " + max + " retries, err " + err, true);

            return;
        }

        // Got an error
        if( err ) { 

            // See if this is a dup-key error
            var idx = dupkeyerror(err);
            
            // Retry case
            if(idx) {

                // Random poll for less than a second
                var timeout=Math.floor(Math.random() % 1000);

                // Call this again on the timeout
                setTimeout(
                    function() { 
                        addNewUserToTable(userTable, username, password, 
                            callback, count+1, max); 
                    }, timeout );

                return;
            }
            else {
                callback( err );
            }
        }
        
        // Success: create new directories:
        var useriddir = basedirectory + '/' + uniqueid;
        var imagedir = useriddir + '/images';

        // Make user directory
        fs.mkdir(useriddir, directorymode, function(err) {

            // Failing to make a directory is pretty serious
            if(err) {

                // Gerenate log message and trace
                wrlog(log, "Error: failed to mkdir " + useriddir + " err " + err, true);

                // Throw this one
                throw(err);

                // Return control
                return;

            }

            // Make images directory
            fs.mkdir(imagedir, directorymode, function(err) {

                if(err) {

                    // Gerenate log message and trace
                    wrlog(log, "Error: failed to mkdir " + imagedir + " err " + err, true);

                    // Throw this one
                    throw(err);
                
                }

                // Callback
                callback( err, user );

            });
        });
    }); 
}

// Insert a new user into mongodb
setNewUserInMongo = function(username, password, callback) {

    getCollection('users', function(error, userTable) {

        if(error) throw (error);

        if(username == undefined) {

            // New error
            var err = new Error('setNewUserInMongo called with NULL username.');

            // Callback
            callback(err);

            // Write to log & console
            wrlog(log, "setNewUserInMongo called with NULL username.", true);
        }

        addNewUserToTable(userTable, username, password, callback, 0, 5);

    });
}

// Set the last login to now.
updateLastLoginInMongo = function(username, callback) {
    getCollection('users', function(error, userTable) {

        if(error) throw (error);
        var lastLogin = Date.now();
        userTable.update({username: username}, {$set: {lastLogin: lastLogin}}, {safe:true}, function(err) {
            if(err) wrlog(log, "Failed update lastlogin users table last login for " + username + 
                " err " + err, true);
            callback(err);
        });
    });
}

// Update the user's current meal count
updateCurrentNumMealsInMongo = function(username, numMeals, callback) {
    getCollection('users', function(error, userTable) {

        if(error) throw (error);
        userTable.update({username: username}, {$set: {numMeals:numMeals}}, {safe:true}, function(err) {
            if(err) wrlog(log, "Failed update numMeals for " + username + " err " 
                + err, true);
            callback(err);
        });
    });
}

// Update the user's current disk usage & number of pictures
updateCurrentNumPicsInMongo = function(username, numPics, callback) {
    getCollection('users', function(error, userTable) {

        if(error) throw (error);
        userTable.update({username: username}, {$set: {numPics:numPics}}, {safe:true}, function(err) {
            if(err) wrlog(log, "Failed update numpics users table for " + username + " err " 
                + err, true);
            callback(err);
        });
    });
}

updateShowPicsPerPageInMongo = function(username, showMealsPerPage, callback) {
    getCollection('users', function(error, userTable) {

        if(error) throw (error);
        userTable.update({username: username}, {$set: {showMealsPerPage:showMealsPerPage}}, {safe:true}, function(err) {
            if(err) wrlog(log, "Failed update showpicsperpage users table for " + username + " err " 
                + err, true);
            callback(err);
        });
    });
}

updateTitleInMongo = function(userid, timestamp, title, callback) {
    getCollection('mealInfo', function(error, mealinfo) {
        if(error) throw(error);
        mealinfo.update({userid: userid, timestamp: timestamp}, {$set: {title: title}}, {safe: true}, function(err) {
            if(err) wrlog(log, "Failed update title mealinfo table for " + username + " mealid " + 
                timestamp + " err " + err, true);
            callback(err);
        });
    });
}

updateRatingInMongo = function(userid, timestamp, rating, callback) {
    getCollection('mealInfo', function(error, mealinfo) {
        if(error) throw(error);
        mealinfo.update({userid: userid, timestamp: timestamp}, {$set: {rating: rating}}, {safe: true}, function(err) {
            if(err) wrlog(log, "Failed update rating mealinfo table for " + username + " mealid " + 
                timestamp + " err " + err, true);
            callback(err);
        });
    });
}

pictsdumppicinfo = function( pinfo ) {
    for(var ii = 0 ; ii < pinfo.length ; ii++) {
        console.log("pinfo[" + ii + "] == " + pinfo[ii].timestamp);
    }
}

// Binary search
findtsinpicinfobinary = function(ts, pinfo) {

    // This will change to a binary search 
    var left = 0;
    var right = pinfo.length;
    var ii = Math.floor(left + ( (right - left) / 2));

    while(true) {

        // Punt on weird errors
        if(undefined == pinfo[ii]) {
            console.log("pinfo[" + ii + "] is undefined");
            console.log("pinfo length is " + pinfo.length);
            return -1;
        }

        // Return index
        if(pinfo[ii].timestamp == ts)
            return ii;

        // Change left endpoint
        if(ts > pinfo[ii].timestamp)
            left = ii + 1;
        // Change right endpoint
        else if(ts < pinfo[ii].timestamp)
            right = ii;

        // Didn't find it
        if(left >= right) return -1;

        // Next element
        ii = Math.floor(left + ( (right - left) / 2));
    }
}

findtsinpicinfolinear = function(ts, pinfo) {

    // Simple scan
    for(var ii = 0 ; ii < pinfo.length ; ii++) {
        if(pinfo[ii].timestamp == ts)
            return ii;
    }
    return -1;
}

findtsinpicinfo = function(ts, pinfo) {

    // TODO - use linear for less than 100 elements, binary otherwise
    var x1 = findtsinpicinfolinear(ts, pinfo);
    var x2 = findtsinpicinfobinary(ts, pinfo);

    if(x1 !== x2) {
        console.log("Error - linear search returns ix " + x1 + " binary returns ix " + x2);
        dumppicinfo(pinfo);
        throw new Error("Linear search returns ix " + x1 + " binary returns ix " + x2);
    }

    return x1;
}

function constToMeal(mc)
{
    if(mc == BREAKFAST)
    {
        return "breakfast";
    }
    if(mc == LUNCH)
    {
        return "lunch";
    }
    if(mc == DINNER)
    {
        return "dinner";
    }
    if(mc == SNACK)
    {
        return "snack";
    }
    if(mc == OTHER)
    {
        return "other";
    }
    return "?";
}

function mealToConst(meal)
{
    if(meal == undefined || !meal)
    {
        return NOMEAL;
    }
    if(meal == "breakfast")
    {
        return BREAKFAST;
    }
    if(meal == "lunch")
    {
        return LUNCH;
    }
    if(meal == "dinner")
    {
        return DINNER;
    }
    if(meal == "snack")
    {
        return SNACK;
    }
    if(meal == "other")
    {
        return OTHER;
    }
    return MAXMEAL;
//    throw new Error("Invalid mealConst: " + meal);
}

/* The 'mealdate' is formatted as YYYYMMDDmm - where the final 'mm' is the meal
 * constant corresponding to the meal in question.  I've decided to leave it 
 * this way because it can be described easily by an index and its sortable.  */
updateMealDateInMongo = function(userid, timestamp, mealdate, callback) {
    getCollection('mealInfo', function(error, mealinfo) {
        if(error) throw(error);
        mealinfo.find( { userid: userid, timestamp: timestamp } ).toArray( function(err, results) {
            if(err) {
                wrlog(log, "Find mealdate error for user " + userid + " timestamp " + timestamp + " err " + err);
                callback(err);
                return;
            }
            if(results.length > 1) {
                var err =new Error(results.length + ' mealInfo records in mongo for ' + userid + ' timestamp ' + timestamp);
                wrlog(log, "Multiple mealdate records for user " + userid + " mealdate " + timestamp, true);
                callback(err);
                return ;
            }

            var oldDate = results[0].mealDate;
            var oldmealconst = oldDate % 100;
            var newmealconst = mealdate % 100;
            var meal = constToMeal(oldmealconst);

            if(oldmealconst != newmealconst) {
                // This turns into an update mealdate and meal in mongo request
                // console.log("updating both mealdate and meal for user " + userid + " timestamp " + timestamp);
                // console.log("oldmeal is " + oldmealconst + " newmeal is " + newmealconst);

                var newmeal = constToMeal(newmealconst);
                if(newmeal != "?") {
                    meal=newmeal;
                }
                else {
                    // Maintain the same const
                    newmealconst = oldmealconst;
                }
            }
            var newMealDate = (mealdate - (mealdate % 100)) + newmealconst;
            mealinfo.update({userid: userid, timestamp: timestamp},
                    {$set: {meal: meal, mealDate: newMealDate}}, {safe: true}, function(err) {
                if(err) wrlog(log, "Update mealdate error for user " + userid + " timestamp " + timestamp + " err " + err);
                // if(err) throw(err);
                callback(err);
            });
        });
    });
}

updateMealInMongo = function(userid, timestamp, meal, callback) {
    getCollection('mealInfo', function(error, mealinfo) {
        if(error) throw(error);

        // Have to find it- this will pull it into the buffer cache
        mealinfo.find( { userid: userid, timestamp: timestamp } ).toArray( function(err, results) {
            if(err) throw(err);
            if(results.length > 1) {
                var err=new Error(results.length + ' mealInfo records in mongo for ' + userid + ' timestamp ' + timestamp);
                wrlog(log, "Multiple mealinfo records in mongo for " + userid + " timestamp " + timestamp, true);
                callback(err);
                return;
            }

            var oldDate = results[0].mealDate;
            var newMealDate = (oldDate - (oldDate % 100)) + mealToConst(meal);

            mealinfo.update({userid: userid, timestamp: timestamp}, 
                    {$set: {meal: meal, mealDate: newMealDate}}, {safe: true}, function(err) {
                if(err) {
                    wrlog(log, "Error updating mealdate in mongo for user " + userid + " ts " 
                        + timestamp + " err " + err, true);
                }
                callback(err);
            });
        });
    });
}

updateReviewInMongo = function(userid, timestamp, review, callback) {
    getCollection('mealInfo', function(error, mealinfo) {
        if(error) throw(error);
        mealinfo.update({userid: userid, timestamp: timestamp}, {$set: {review: review}}, {safe: true}, function(err) {
            if(err) {
                wrlog(log, "Error updating review in mongo for user " + userid + " ts " + 
                    timestamp + " err " + err, true);
            }
            callback(err);
        });
    });
}

updateTmpReviewInMongo = function(userid, timestamp, tmpreview, callback) {
    getCollection('mealInfo', function(error, mealinfo) {
        if(error) throw(error);
        mealinfo.update({userid: userid, timestamp: timestamp}, {$set: {tmpReview: tmpreview}}, {safe: true}, function(err) {
            if(err) {
                wrlog(log, "Error updating tmpreview in mongo for user " + userid + " ts " + 
                    timestamp + " err " + err, true);
            }
            callback(err);
        });
    });
}

// Update the user's mealinfo information
updateCompleteMealInfoInMongo = function(mealinfo, callback) {
    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);

        mealInfo.update({userid:mealinfo.userid, timestamp:mealinfo.timestamp}, mealinfo, {safe:true}, function(err) {
            if(err) {
                wrlog(log, "Error updating mealinfo in mongo for user " + mealinfo.userid + " ts " + 
                    mealinfo.timestamp + " err " + err, true);
            }
            callback(err);
        });
    });
}


// Update a user's password
updatePasswordInMongo = function(username, newpassword, callback) {
    getCollection('users', function(error, userTable) {
        if(error) throw (error);
        userTable.update({username: username}, {$set: {password: newpassword}}, {safe:true}, function(err) {
            if(err) {
                wrlog(log, "Error updating password in mongo for user " + username + " err " + err, true);
            }
            callback(err);
        });
    });
}

// Information record

// username
// timestamp
// name-of-picture
// size-of-picture
// pubicly-viewable?
// verified-by-admin?
// ranking?
// name-of-restaurant
// meal (breakfast/lunch/dinner/snack .. )
// latitude
// longitude
// blog-entry

// Both picture and thumb record should have
// username
// timestamp
// publicly-viewable
// verified-by-admin

// Get a single mealInfo from Mongo
getOneMealInfoFromMongoInternal = function(userid, timestamp, getextra, callback) {

    var projection; 
    
    if(getextra) {
        projection = { 'userid' : 1, 'mealDate': 1, 'title': 1, 'timestamp' : 1, 'meal' : 1, 'published' : 1, 
            'rating' : 1, 'review' : 1, 'picInfo' : 1, 'keytimestamp' : 1 };
    }
    else {
        projection = { 'userid' : 1, 'mealDate': 1, 'title': 1, 'timestamp' : 1, 'meal' : 1, 'published' : 1, 
            'picInfo' : 1, 'keytimestamp' : 1 };
    }
    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);
        
        mealInfo.find(  {userid: userid, timestamp: timestamp, deleted: false }, projection )
        .toArray( function(err, results) {
            if(err) {
                wrlog(log, "Mongo error finding mealinfo for userid " + userid + " timestamp " + timestamp + 
                    " err " + err, true);
                callback(err);
                return;
            }
            if(results.length > 1) {
                var error=new Error(results.length + ' mealInfo records in mongo for ' + userid + ' timestamp ' + timestamp);
                wrlog(log, "Multiple meals for for userid " + userid + " timestamp " + timestamp + 
                    " err " + err);
                callback(error);
                return;
            }
            if(results.length == 0) {
                callback(err);
            }
            else {
                callback(err, results[0]);
            }
        });
    });
}

getOneMealInfoFromMongoReview = function(userid, timestamp, callback) {
    return getOneMealInfoFromMongoInternal(userid, timestamp, true, callback);
}

getOneMealInfoFromMongo = function(userid, timestamp, callback) {
    return getOneMealInfoFromMongoInternal(userid, timestamp, false, callback);
}

// To delete, I just set the deleted flag - later I have a task which deletes the older deletes nightly
// (maybe there will be a waste-bin where I can undelete meals..)
setDeleteFlagInMongo = function(userid, timestamp, callback) {
    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);
        var deletedTime = Date.now();
            mealInfo.findAndModify({userid:userid, timestamp:timestamp, deleted:false}, [], {$set: {deleted:true, whenDeleted: deletedTime}},{new:true}, function(err, record) {
            if(err) {
                wrlog(log, "Error setting delete flag for user " + userid + " timestamp " + timestamp + 
                    " err " + err, true);
                callback(err);
                return;
            }
            db.lastError(function(error, result) {
                callback(err, record, result.updatedExisting);
            });
        });
    });
}

// TODO
// Remove the mealinfo record, the meal record, and the mealthumb record
// this is for the trashcan page - maybe i'll use duplicate code for an 
// admin page, or an auto purge program.
purgeMealFromMongo = function(username, timestamp, callback) {
}

// Get mealinfo information.  Call this the first time with afterTs set
// to 0, and always pass in the timestamp of the last record.
getMealInfoFromMongoFwd_int = function(userid, ts, limit, viewDeleted, wholerec, callback) {
    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);

        var projection = {};
        if(!wholerec) {
            projection = { 'userid' : 1, 'mealDate': 1, 'title': 1, 'timestamp' : 1, 'meal' : 1, 
                'published' : 1, 'picInfo' : 1, 'keytimestamp' : 1 };
        }

        // Make sure to sort in the direction of your search to get sane results.
        mealInfo.find(
            // Criteria
            { $and  :                               [   { userid: userid },
                                                        { timestamp: { $gte: ts } },
                                                        { deleted: viewDeleted } ] },
            // Index
            // { $hint : { username: 1, mealDate: 1, timestamp: 1 } },

            // Columns
            projection )

            // Order
            .sort( { timestamp : 1 } )

            // Limit
            .limit( limit + 1 )

            // Array
            .toArray( function ( err, results ) {

            if(err) 
            {
                wrlog(log, "Mongo error finding forward mealinfo for userid " + userid + " timestamp " + 
                    timestamp + " err " + err, true);
                callback(err);
                return;
            }

            var prevmealtimestamp = 0;
            //var prevmealdate = 0;

            var newlimit=0;

            // sort( { 'timestamp' : -1 } ) doesn't work
            results.reverse();

            if( results.length > limit ) {
                // Get first prevmeal timestamp
                prevmealtimestamp = results[0].timestamp;
                results = results.slice(1, limit + 1);

                // Search only a single record in the other direction for a nextpage.
                newlimit = 0;
            }
            else {
                // Calculate new limit (you are on the first page, so fill it).
                newlimit = (limit - results.length);
            }

            mealInfo.find(

                // Query
                { $and  :                           [   { userid: userid },
                                                        { timestamp: { $lt: ts } },
                                                        { deleted: viewDeleted } ] },
                        

                // Index
                // { $hint : { username: 1, mealDate: 1, timestamp: 1 } },

                // Columns
                projection ) 
                // Sort
                .sort( { timestamp : -1 } )

                // Limit
                .limit( newlimit + 1 )

                // Array
                .toArray( function( err, results2 ) {

                    if(err) 
                    {
                        wrlog(log, "Mongo error finding forward(2) mealinfo for userid " + userid + " timestamp " + 
                            timestamp + " err " + err, true);
                        callback(err);
                        return;
                    }

                    //var nextmealdate = 0;
                    var nextmealtimestamp = 0;

                    if( results2.length > newlimit ) {
                        nextmealtimestamp = results2[newlimit].timestamp;
                        results2 = results2.slice(0, newlimit);
                    }
                    callback(err, results.concat(results2), 
                        nextmealtimestamp, prevmealtimestamp);
            });
        });
    });
}

getMealInfoFromMongoFwd = function(userid, ts, limit, viewDeleted, callback) {
    getMealInfoFromMongoFwd_int(userid, ts, limit, viewDeleted, true, callback);
}

getMealInfoFromMongoFwdMenu = function(userid, ts, limit, viewDeleted, callback) {
    getMealInfoFromMongoFwd_int(userid, ts, limit, viewDeleted, false, callback);
}

// This is the 'next' case.
getMealInfoFromMongoRev_int = function(userid, ts, limit, viewDeleted, wholerec, callback) {
    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);

        var projection = {};
        var cnt = 0;

        if(!wholerec) {
            projection = { 'userid' : 1, 'mealDate': 1, 'title': 1, 'timestamp' : 1, 'meal' : 1, 
                'published' : 1, 'picInfo' : 1, 'keytimestamp' : 1 };
        }
        
        // This is convoluted query finds mealinfo records before mealDate, timestamp.
        mealInfo.find(

            // Query
            { $and  :                               [   { userid: userid },
                                                        { timestamp: { $lte: ts } },
                                                        { deleted: viewDeleted } ] },


            // Index
            //{ $hint : {    username: 1, mealDate: 1, timestamp: 1 } }, 

            // Columns
            projection )

            // Sort
            .sort( {timestamp: -1})

            // Limit
            .limit(limit + 1)

            // Results
            .toArray( function(err, results) {

            var nexttimestamp=0;
            var nextmealdate=0;

            // Throw an error for now
            if(err) 
            {
                wrlog(log, "Mongo error finding backwards mealinfo for userid " + userid + " timestamp " + 
                    timestamp + " err " + err, true);
                callback(err);
                return;
            }

            // Fill nextmealdate and timestamp
            if( results.length > limit ) {

                nexttimestamp=results[limit].timestamp;
                results = results.slice(0, limit);

            }

            // Search one record in the other direction
            mealInfo.find( 

            // Query
            { $and  :                               [   { userid: userid },
                                                        { timestamp: { $gt: ts } },
                                                        { deleted: viewDeleted } ] },

            // Index
            //{ $hint :   { username: 1, mealDate: 1, timestamp: 1 } },

            // Columns
            projection )

            // Sort
            .sort( { timestamp: 1})

            // Limit
            .limit(1)

            // Results
            .toArray(function(err, presults) {

                var prevtimestamp=0;

                // Throw an error for now
                if(err) 
                {
                    wrlog(log, "Mongo error finding backwards(2) mealinfo for userid " + userid + " timestamp " + 
                        timestamp + " err " + err, true);
                    callback(err);
                    return;
                }

                // Fill previous mealDate and timestamp variables
                if(presults.length > 0) {

                    prevtimestamp=presults[0].timestamp;

                }

                // Invoke callback
                callback(err, results, nexttimestamp, prevtimestamp);

            }); // prevPage toArray

        }); // Original query toArray

    }); // getCollection(mealinfo)

}

getMealInfoFromMongoRev = function(userid, ts, limit, viewDeleted, callback) {
    getMealInfoFromMongoRev_int(userid, ts, limit, viewDeleted, true, callback);
}

getMealInfoFromMongoRevMenu = function(userid, ts, limit, viewDeleted, callback) {
    getMealInfoFromMongoRev_int(userid, ts, limit, viewDeleted, false, callback);
}

updateMealInfoPicInfoInMongo = function(mymealinfo, callback, isdelete, dtimestamp) {

    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);

        // Some sanity checks
        if(mymealinfo.userid == undefined) {
            var err = new Error('updateMealInfoPicInfoInMongo called with undefined username');
            wrlog(log, "updatemealinfopicinfo called with undefined userid", true);
            callback(err);
            return;
        }
        if(mymealinfo.timestamp == undefined) {
            var err = new Error('updateMealInfoPicInfoInMongo called with undefined timestamp');
            wrlog(log, "updatemealinfopicinfo called with undefined timestamp", true);
            callback(err);
            return;
        }
        if(mymealinfo.timestamp <= 0) {
            var err= new Error('updateMealInfoPicInfoInMongo called with invalid timestamp');
            wrlog(log, "updatemealinfopicinfo called with invalid timestamp", true);
            callback(err);
            return;
        }

        var keyts = mymealinfo.keytimestamp ? mymealinfo.keytimestamp : 0;

        mealInfo.update({userid: mymealinfo.userid, timestamp:mymealinfo.timestamp}, 
            {$set: {picInfo: mymealinfo.picInfo, keytimestamp: keyts }}, {safe:true}, function(err) {
                if(err) {
                    wrlog(log, "updatemealinfopicinfo update failure for user " + 
                        mymealinfo.userid + " ts " + mymealinfo.timestamp, true);
                    callback(err);
                    return;
                }

                if(deletetrace && isdelete) {

                    // Delete user trace
                    wrlog(log, "Delete user=" + mymealinfo.userid + " timestamp=" + dtimestamp, true );

                    // Dump the picinfo
                    pictsdumppicinfo(mymealinfo.picInfo);

                    console.log(" ");
                }
                callback(err);
            });

    });
}

updateKeyPicInMongo = function(userid, mealts, picts, callback) {
    getCollection('mealInfo', function(error, mealinfo) {
        if(error) throw(error);

        // Find this meal
        mealinfo.find( { userid: userid, timestamp: mealts } ).toArray( function(err, results) {
            if(err) {
                wrlog(log, "Error updating key picture for userid " + userid + " mealts " + mealts + 
                    " err " + err, true);
                callback(err);
                return;
            }
            if(results.length > 1) {
                var error = new Error(results.length + ' mealInfo records in mongo for ' + userid + ' timestamp ' + mealts);
                wrlog(log, "Error updating key picture: multiple mealpics found for userid " + 
                    userid + " mealts " + mealts + " err " + err, true);
                callback(err);
                return;
            }

            var result = results[0];

            // Find key picture in picinfo
            var ii = findtsinpicinfo(picts, result.picInfo);

            if(ii < 0) {
                var err = new Error("Couldn't find picture");
                wrlog(log, "Error updating key pic: couldn't find picture with timestamp " + picts + " for user "
                        + userid + " mealts " + mealts, true);
                callback(err);
                return;
            }

            // Set the new keytimestamp
            result.keytimestamp = picts;

            // Update mongo
            mealinfo.update( { userid: userid, timestamp: mealts }, 
                { $set: {keytimestamp: picts} }, {safe:true}, function(err) {
                    if(err) {
                        wrlog(log, "Error updating key picture for userid " + userid + " mealts " + 
                            mealts + " err " + err, true);
                    }
                    callback(err);
                    return;
                }
            );
        });
    });
}

deletePicFromMongo = function(userid, mealts, picts, callback) {
    getCollection('mealInfo', function(error, mealinfo) {
        if(error) throw(error);
        mealinfo.find( { userid: userid, timestamp: mealts } ).toArray( function(err, results) {
            if(err) {
                wrlog(log, "Error deleting picture for userid " + userid + " mealts " + mealts + 
                    " picts " + picts + " err " + err, true);
                callback(err);
                return;
            }
            if(results.length > 1) {
                var err = new Error(results.length + ' mealInfo records in mongo for ' + userid + ' timestamp ' + mealts);
                wrlog(log, "Error deleting picture multiple meal records for userid " + userid + " mealts " + mealts, true );
                callback(err);
                return;
            }

            var result = results[0];
            var ii;

            if(!result || !result.picInfo) {
                // console.log("Null result.picInfo for user=" + userid + " timestamp=" + picts);
                var err = new Error("Null result.picInfo");
                wrlog(log, "Null picinfo for user " + userid + " mealts " + mealts, true);
                callback(err);
                return;
            }

            ii = findtsinpicinfo(picts, result.picInfo);

            // This will change to a binary search 
            if(ii < 0) {
                var err = new Error("Couldn't find picture");
                wrlog(log, "Delete picture couldn't find picture for userid " + userid + " mealts " + 
                        mealts + " picts " + picts, true);
                callback(err);
                return;
            }
            else {
                // Delete the picture
                result.picInfo.splice(ii, 1);
            }

            // Start async database deletes
            deleteMealPicInMongo(userid, mealts, picts);
            deleteMealThumbInMongo(userid, mealts, picts);
            deleteMealIconInMongo(userid, mealts, picts);

            if(result.keytimestamp && result.keytimestamp == picts) {
                result.keytimestamp = 0;
            }

            // Delete
            updateMealInfoPicInfoInMongo(result, callback, true, picts);
        });
    });
}

setMealInfoInMongo = function(mymealinfo, callback) {
    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);

        // Some sanity checks
        if(mymealinfo.userid == undefined) {
            var err = new Error('setMealInfoInMongo called with undefined userid');
            wrlog(log, "err " + err, true);
            callback(err);
            return;
        }
        if(mymealinfo.timestamp == undefined) {
            var err = new Error('setMealInfoInMongo called with undefined timestamp');
            wrlog(log, "err " + err, true);
            callback(err);
            return;
        }
        if(mymealinfo.timestamp <= 0) {
            var err = new Error('setMealInfoInMongo called with invalid timestamp');
            wrlog(log, "err " + err, true);
            callback(err);
            return;
        }

        // Insert the meal information
        mealInfo.insert(mymealinfo, {safe:true}, function(err, object) {
            if(err) {
                wrlog(log, "Error inserting meal in mongo for userid " + mymealinfo.userid + 
                    " err " + err, true);
                callback(err);
                return;
            }

            // Keeping with my clever hack
            var newmealdir = basedirectory + '/' + mymealinfo.userid + '/images/' + mymealinfo.timestamp;

            fs.mkdir(newmealdir, directorymode, function(err) {
                if(err) {
                    wrlog(log, "Error making directory for new meal " + err, true);
                    callback(err);
                    return;
                }
                callback(null, object);
            });
        });
    });
}

function filename_for_image(userid, mealts, picts) {
    return basedirectory + '/' + userid + '/images/' + mealts + '/img.' + picts;
}

function filename_for_thumb(userid, mealts, picts) {
    return basedirectory + '/' + userid + '/images/' + mealts + '/thm.' + picts;
}

function filename_for_icon(userid, mealts, picts) {
    return basedirectory + '/' + userid + '/images/' + mealts + '/ico.' + picts;
}

function rediskey_for_image(userid, picts) {
    return userid + '.' + '.img.' + picts;
}

function rediskey_for_thumb(userid, picts) {
    return userid + '.' + '.thm.' + picts;
}

function rediskey_for_icon(userid, picts) {
    return userid + '.' + '.ico.' + picts;
}

setMealFsRedis = function(mealinfo, fname_f, rkey_f, callback) {

    // Redis key
    var rediskey = rkey_f(mealinfo.userid, mealinfo.timestamp);

    // Write to redis
    redisClient.set(rediskey, mealinfo.image, function(err, reply) {

        // Throw any errors
        if(err) throw (err);

        // Invoke callback
        callback( err, mealinfo );

    });

    // File name
    var picname = fname_f(mealinfo.userid, mealinfo.mitimestamp, mealinfo.timestamp);

    // Write file asynchronously
    fs.writeFile(picname, mealinfo.image, "binary", function(err) {

        if(err) {

            // Print error trace
            wrlog(log, "Error writing " + picname + ": " + err, true);

            // Can't write to the filesystem - better throw this
            throw (err);

        }

    });
}

// Set a meal-icon
setMealIcon = function(mealicon, callback) {
    return setMealFsRedis(mealicon, filename_for_icon, rediskey_for_icon, callback);
}

// Set a meal-thumb
setMealThumb = function(mealthumb, callback) {
    return setMealFsRedis(mealthumb, filename_for_thumb, rediskey_for_thumb, callback);
}

// Set a meal-thumb
setMealPic = function(mealpic, callback) {
    return setMealFsRedis(mealpic, filename_for_image, rediskey_for_image, callback);
}


// Set a meal-thumb
setMealThumb = function(mealthumb, callback) {

    // Redis key
    var rediskey = rediskey_for_thumb(mealthumb.userid, mealthumb.timestamp);

    // Write to redis
    redisClient.set(rediskey, mealthumb.image, function(err, reply) {

        // Throw any errors
        if(err) throw (err);

        // Invoke callback
        callback(err, mealthumb);

    });

    // Write to the file asynchronously
    var picname = filename_for_thumb(mealthumb.userid, mealthumb.mitimestamp, mealthumb.timestamp);

    // Write file asynchronously
    fs.writeFile(picname, mealthumb.image, "binary", function(err) {

        // If there's an error, throw it
        if(err) {
            // Print error trace
            wrlog(log, "Error writing " + picname + ": " + err, true);

            // Can't write to the filesystem - throw this 
            throw(err);
        }

    });
}

deleteMealIconInMongo = function(userid, mealts, timestamp, callback) {
    getCollection('mealIcons', function(error, mealIcons) {

        if(error) throw(error);

        mealIcons.remove({userid: userid, timestamp: timestamp }, function(err, object) {
            if(deletetrace) {
                console.log("delete mealicon user=" + userid + " timestamp=" + timestamp);
            }
            if(callback) callback( err, object );

            // Filename
            var iconname = filename_for_icon(userid, mealts, timestamp);

            // Redis key
            var rediskey = rediskey_for_icon(userid, mealts, timestamp);

            // Delete redis key
            redisClient.del(rediskey, function(err, reply) {
                if(err) console.log("Error deleting icon " + rediskey + " from redis");
            });

            // Delete file
            fs.unlink(iconname, function(err) {
                if(err) console.log("Error deleting icon " + iconname + " from fs");
            });
        });
    });
}

// Delete a meal-thumb
deleteMealThumbInMongo = function(userid, mealts, timestamp, callback) {
    getCollection('mealThumbs', function(error, mealThumbs) {
        if(error) throw (error);

        mealThumbs.remove({ userid: userid, timestamp: timestamp }, function(err, object) {
            if(err) throw (err);
            if(deletetrace) {
                console.log("delete mealthumb user=" + userid + " timestamp=" + timestamp);
            }
            if(callback) callback( err, object );

            // Filename
            var thumbname = filename_for_thumb(userid, mealts, timestamp);

            // Redis key
            var rediskey = rediskey_for_thumb(userid, timestamp);

            // Delete redis key
            redisClient.del(rediskey, function(err, reply) {
                if(err) console.log("Error deleting thumb " + rediskey + " from redis");
            });

            // Delete file
            fs.unlink(thumbname, function(err) {
                if(err) console.log("Error deleting thumb " + thumbname + " from fs");
            });
        });
    });
}

// Delete a meal picture
deleteMealPicInMongo = function(userid, mealts, timestamp, callback) {
    getCollection('mealPics', function(error, mealPics) {
        if(error) throw (error);

        mealPics.remove({ userid: userid, timestamp: timestamp },  function(err, object) {
            if(err) throw (err);
            if(deletetrace) {
                console.log("delete mealpic user=" + userid + " timestamp=" + timestamp);
            }

            // Callback now
            if(callback) callback( err, object );

            // Filename
            var picname = filename_for_image(userid, mealts, timestamp);

            // Redis key
            var rediskey = rediskey_for_image(userid, timestamp);

            // Delete redis key
            redisClient.del(rediskey, function(err, reply) {
                if(err) console.log("Error deleting image " + rediskey + " from redis");
            });

            // Delete file
            fs.unlink(picname, function(err) {
                if(err) console.log("Error deleting image " + picname + " from fs");
            });

        });
    });
}

// Set the record in mongo
setMealRecordInMongo = function(mealrec, callback) {

    // Get collection
    getCollection('mealPics', function(error, mealPics) {

        // Throw any errors
        if(error) throw (error);

        // Insert
        mealPics.insert(mealrec, {safe:true}, function(err, object) {

            // Throw any errors
            if(err) throw (err);

            // Callback
            callback(err, mealrec);

        });
    });
}



// Retrieve a meal picture from mongodb
getMealPicFromMongoInt = function(userid, timestamp, fname_f, rkey_f, callback) {
    getCollection('mealPics', function(error, mealPics) {

        // Throw an error if you got one
        if(error) throw (error);

        // Count completions
        var count = 0;

        // Declare reply
        var reply = null;

        // Declare results
        var results = null;

        // Call callback wrapper
        function invokecallback(err, results) {

            // Callback immediately on error
            if(err || !clientpiclatencytest) {
                callback(err, results);
                return;
            }

            // Set a timeout here
            setTimeout( 
                    function() { 
                        // wrlog(log, "Writing userid " + userid + " ts " + timestamp + " latency " + clientpiclatencyms, true);
                        callback(err, results); 
                    }, clientpiclatencyms );
        }

        // Unified complete function
        function getmealpiccb( err, res, rep) {

            // Throw any errors
            if(err) {

                // Print a log message
                wrlog(log, "Error getting mealpic for userid " + userid + " timestamp " + timestamp, true );

                // Throw this error
                throw( err );
            }

            // Filled by mongo find
            if(res) results = res;

            // Filled by redis find
            if(rep) reply = rep;

            // Continue if we have responses from both
            if(++count == 2) {

                // Sanity check mongo 
                if(results.length > 1) {
                    var err = new Error(results.length + ' pics in Mongo for ' + userid + ' timestamp ' + timestamp);
                    invokecallback(err);
                    return;
                }

                // No records
                if(!results || results.length <= 0) {
                    invokecallback(err);
                    return;
                }

                // Check reply from redis
                if(reply) {

                    // Found image in redis
                    results[0].image = reply;

                    // Invoke callback
                    invokecallback(err, results[0]);

                }

                // Cache miss 
                else {

                    // Form filename for image
                    var fsname = fname_f( userid, results[0].mitimestamp, timestamp);

                    // Read file
                    fs.readFile(fsname, "binary", function(err, image) {

                        // Throw error if I got it
                        if(err) throw(err);

                        // Set image
                        results[0].image = image;

                        // Races but we should hit the fs cache if redis loses
                        redisClient.set(rediskey, image, function(err, reply) {
                            if(err) throw (err);
                        });

                        // Invoke callback
                        invokecallback( null, results[0] );

                    });
                }
            }
        }

        // Send asynchronous search to mongo
        mealPics.find( {userid:userid, timestamp: timestamp}).toArray( function( err, results) {
            getmealpiccb( err, results, null);
        });

        // Form redis-key
        var rediskey = rkey_f(userid, timestamp);

        // Send asynchronous search to redis
        if(redispiccache) {
            redisClient.get(rediskey, function( err, reply ) {
                getmealpiccb( err, null, reply);
            });
        }
        else {
            getmealpiccb( null, null, null);
        }
    });
}

getMealPicFromMongo = function(userid, timestamp, callback) {
    return getMealPicFromMongoInt(userid, timestamp, filename_for_image, rediskey_for_image, callback );
}

getMealThumbFromMongo = function(userid, timestamp, callback) {
    return getMealPicFromMongoInt(userid, timestamp, filename_for_thumb, rediskey_for_thumb, callback );
}

getMealIconFromMongo = function(userid, timestamp, callback) {
    return getMealPicFromMongoInt(userid, timestamp, filename_for_icon, rediskey_for_icon, callback );
}

getRestaurantInfoById = function(restaurantId, callback) {
    getCollection('restaurants', function(error, restaurantTable) {
        if(error) throw(error);
        restaurantTable.find({restaurantId: restaurantId}).toArray( function(err, results) {
            if(err) throw(err);
            if(results.length > 1) {
                throw new Error(results.length + ' usernames in Mongo for ' + restaurantId);
            }
            if(results.length == 0) {
                callback(err);
            }
            else {
                callback(err, results[0]);
            }
        });
    });
}

// Retrieve a user from mongodb
getUserFromMongo = function(username, callback) {
    getCollection('users', function(error, userTable) {
        if(error) throw (error);
        userTable.find({username: username}).toArray( function(err, results) {
            if(err) throw(err);
            if(results.length > 1) {
                throw new Error(results.length + ' usernames in Mongo for ' + username);
            }
            if(results.length == 0) {
                callback(err);
            }
            else {
                callback(err, results[0]);
            }
        });
    });
}

updateCompleteUserInfoInMongo = function(user, callback) {
    getCollection('users', function(error, userTable) {
        if(error) throw (error);
        userTable.update({username:user.username}, user, {safe:true}, function(err) {
            if(err) throw(err);
            callback(err);
        });
    });
}

// Create a redis-store for my cookies.
var RedisStore = require('connect-redis')(express);

// Create a redis-client for my general use
var redisClient = require('redis').createClient();

// Configure redis as an lru-cache
redisClient.config("set", "maxmemory-policy", "allkeys-lru");

// Mailer
var mailer = require('nodemailer').createTransport("SMTP", {
        service: org,
    });

// Factual - deprecated (too expensive)
//var Factual = require('factual-api');
//var factual = new Factual('LzksHLqX8K3gj0bYYA9l6JKORk54vonNU0KgtxqW', '8d9wsuBG88LQicb0mtrsiqXOVrEJTGYPaLW3wItg');

// Choose images (temporary)
//var first = 1;
var lastimage = 0;
var rotating_images;
//var basedir = '/data/mhannum/thumbs/';

// Create a server
var app = module.exports = express.createServer();

var maxCookieAge = 30 * 24 * 60 * 60 * msPerSecond;

// Rate limit a bit
var geoMaxCheckInterval = 10 * msPerSecond;

/*
function getGeoIp(req, res, next) {

    // Short circuit if we don't have a session yet
    if(req.session == undefined || req.session.user == undefined) {
        next();
        return;
    }

    // Don't query the database too often
    if(req.session.user.lastGeo != undefined && req.session.user.lastGeo + geoMaxCheckInterval > Date.now()){
        next();
        return;
    }

    // Retrieve my ip
    var ipAddr = getClientIp(req);

    // Update only if the client's ip address has changed
    if(undefined != ipAddr && ipAddr != req.session.user.lastIp) {

        req.session.user.lastGeo = Date.now();
        req.session.user.lastIp = ipAddr;
        city.lookup(ipAddr, function(err, data){
            if(data) {
                req.session.user.geoip = data;
            }
        });
    }
    next();
    return;
}
*/

// Configuration
app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session( {
        secret: 'sexbomb-bastic',
        store: new RedisStore,
        // key: 'APP', /* This will be set to APP when I deploy */
        cookie: {
            maxAge: maxCookieAge
        }
    }));
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
//    app.use(getGeoIp);
    app.use(app.router);
});


// TODO: add a bit of error handling
app.use(function errorHandler(err, req, res, next) {
    next(err, req, res);
});


app.configure('development', function(){
    app.use(express.logger());
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.logger());
    app.use(express.errorHandler());
});

function show(req, res, err, img)
{
    res.writeHead(200, {'Content-type': 'image/jpg' });
    res.end(img, 'binary');
}

function showimage(req, res, err, file)
{
    if(err) 
        throw (err);

    fs.readFile(basedir + file, function(err, img) {
        if(err) 
        throw (err);
    show(req, res, err, img);
    });
}

function chooseimage(req, res, err, files)
{
    var image;
    if (err) 
        throw(err);
    image = files[lastimage++ % files.length];
    showimage(req, res, err, image);
}

// This is functionized to accomodate async-thumb code
function showMealPicture( req, res, userid, timestamp ) {
    getMealPicFromMongo(userid, timestamp, function(err, mealpic) {

        if(err || mealpic == undefined) {
            // TODO - create a default 'not-found' picture. 
            // res.writeHead(200, {'Content-Type': 'image/jpeg' });
            // res.end( notfound.pic, 'binary');
            showNotFoundPicture(req, res);
            return;
        }
        // Display the image if we got it
        if(mealpic.published || mealpic.userid == req.session.user.userid) {

            if(clientpictrace) {
                wrlog(log, "Send mealpic for mealuserid " + mealpic.userid + " timestamp " + 
                    timestamp + " to userid " + userid, true);
            }

            res.contentType(mealpic.imageType);
            res.end(mealpic.image, 'binary');
        } 
        else {
              // TODO - create a default 'no permission' picture. 
              // res.writeHead(200, {'Content-Type': 'image/jpeg' });
              // res.end( nopermission.pic, 'binary');
            showNotFoundPicture(req, res);
            return;
        }
    });
}

// Retrieve a pictures
app.get('/pics/:username/:timestamp', function(req, res) {
    var userid = parseInt(req.params.username, 10);
    var timestamp = parseInt(req.params.timestamp, 10);
    showMealPicture(req, res, userid, timestamp);
});

var showFavicon = function(req, res) {

    // Read it from disk the first time.
    if(favicon == null) {
        fs.readFile('public/images/mealfavicon.ico', function(err, img) {
            if(err) throw(err);
            favicon = img;
            res.writeHead(200, {'Content-type': 'image/x-icon'});
            res.end(favicon, 'binary');
        });
        return;
    }

    res.writeHead(200, {'Content-type': 'image/png'});
    res.end(favicon, 'binary');
}

var showNoMealPicture = function(req, res) {

    // Read it from disk the first time.
    if(nomealpic == null) {
        fs.readFile('public/images/nomeal.png', function(err, img) {
            if(err) throw(err);
            nomealpic = img;
            res.writeHead(200, {'Content-type': 'image/png'});
            res.end(nomealpic, 'binary');
        });
        return;
    }

    res.writeHead(200, {'Content-type': 'image/png'});
    res.end(nomealpic, 'binary');
}

var showNotFoundPicture = function(req, res) {

    // Read it from disk the first time.
    if(notfoundpic == null) {
        fs.readFile('public/images/notfound.png', function(err, img) {
            if(err) throw(err);
            notfoundpic = img;
            res.writeHead(200, {'Content-type': 'image/png'});
            res.end(notfoundpic, 'binary');
        });
        return;
    }

    res.writeHead(200, {'Content-type': 'image/png'});
    res.end(notfoundpic, 'binary');
}

var showNotFoundThumb = function(req, res) {

    // Read it from disk the first time.
    if(notfoundthumb == null) {
        fs.readFile('public/images/notfoundthumb.png', function(err, img) {
            if(err) throw(err);
            notfoundthumb = img;
            res.writeHead(200, {'Content-type': 'image/png'});
            res.end(notfoundthumb, 'binary');
        });
        return;
    }

    res.writeHead(200, {'Content-type': 'image/png'});
    res.end(notfoundthumb, 'binary');
}

app.get('/images/notfound.png', function(req, res) {
    showNotFoundPicture(req, res);
});

var nomealcount = 0;

// Call the nomeal picture handler
app.get('public/images/nomeal.png', function(req, res) {
    showNoMealPicture(req, res);
});

app.get('/favicon.ico', function(req, res) {
    showFavicon(req, res);
});

app.get('/favicon', function(req, res) {
    showFavicon(req, res);
});

app.get('/images/notfoundthumb.png', function(req, res) {
    showNotFoundThumb(req, res);
});

// Retrieve an icon
app.get('/icon/:userid/:timestamp', function(req, res) {

    var userid = parseInt(req.params.userid, 10);
    var timestamp = parseInt(req.params.timestamp);

    getMealIconFromMongo(userid, timestamp, function(err, mealicon) {
        if(err) throw(err);
        if(mealicon == undefined) {

            console.log('mealicon is undefined for userid ' + userid + ' ts ' + timestamp );

            // Show the actual image (even though this is slow)
            showMealPicture( req, res, userid, timestamp );

            return;
        }

        if(mealicon.published || mealicon.userid == userid) {

            if(clientpictrace) {
                wrlog(log, "Send mealicon for mealuserid " + mealicon.userid + " timestamp " + 
                    timestamp + " to userid " + userid, true);
            }

            res.contentType(mealicon.imageType);
            res.end(mealicon.image, 'binary');
            return;
        }
        else {
            showNotFoundIcon(req, res);
            return;
        }
    });
});

// Retrieve a thumbnail
app.get('/thumbs/:userid/:timestamp', function(req, res) {

    var userid = parseInt(req.params.userid, 10);
    var timestamp = parseInt(req.params.timestamp);

    // Retrieve the meal thumbnail
    getMealThumbFromMongo(userid/* userid */, timestamp, function(err, mealthumb) {

        if(err) throw (err);

        // Show an error image, or something
        if(mealthumb == undefined || simulatemissingthumb) {
            // TODO: create a default 'not-found' picture. 
            // res.writeHead(200, {'Content-Type': 'image/jpeg' });
            // res.end( notfound.pic, 'binary');
            console.log('mealthumb is undefined for userid=' +  userid + ' timestamp=' + timestamp);

            // Try to find the actual image
            showMealPicture( req, res, userid, timestamp );

            return;
        }

        // Display the image if we got it
        if(mealthumb.published || mealthumb.userid == userid) { 
            if(clientpictrace) {
                wrlog(log, "Send mealthumb for mealuserid " + mealthumb.userid + " timestamp " + 
                    timestamp + " to userid " + userid, true);
            }
            res.contentType(mealthumb.imageType);
            res.end(mealthumb.image, 'binary');
            return ;
        } 
        // This user isn't privledged to see this
        else {
              // TODO - create a default 'no permission' picture. 
              // res.writeHead(200, {'Content-Type': 'image/jpeg' });
              // res.end( nopermission.pic, 'binary');

              // Send out the nomeal thumb
              showNotFoundThumb(req, res);

              return;
        }
    });
});

// Set attributes page - simple serverside code: just send down pic information
app.get('/attributes/:username/:timestamp', function(req, res) {

    if(req.session.user == undefined) {
        req.session.nextpage = '/attributes/' + req.params.username + '/' + req.params.timestamp;
        res.redirect('/signin');
        return;
    }
        
    if(req.session.user.username != req.params.username && req.session.user.isAdmin != true) {
        req.session.nextpage = '/attributes/' + req.params.username + '/' + req.params.timestamp;
        res.redirect('/signin');
        return;
    }

    // Get the meal info record
    getOneMealInfoFromMongo(req.params.username, parseInt(req.params.timestamp, 10), function(err, mealInfo) {
        if(err) {
            throw (err); 
        }
        // This meal apparently doesn't exist
        if(undefined == mealInfo) {
            console.log('request for attribute edit of non-existant meal for ' + req.params.username + '/' + req.params.timestamp);
            // TODO - send an email to the administrator & ask them to verify the integrity of mealInfo
            res.redirect('/');
            return;
        }

        if(mealInfo.restaurantId > 0) {
            getRestaurantInfoById(mealInfo.restaurantId, function(err, restaurantInfo) {
                if(err) throw(err);
                if(undefined == restaurantInfo) {
                    console.log('non-existant restaurant for meal: ' + mealInfo.username + ":" + mealInfo.timestamp + 
                        "restaurantId: " + mealInfo.restaurantId);

                    res.render('attributes.ejs', {
                        restaurantId: -1,
                        restaurant: "",
                        meal: mealInfo,
                        user: req.session.user,
                        uploadflag: false
                    });
                }
                else {
                    res.render('attributes.ejs', {
                        restaurantId: mealInfo.restaurantId,
                        restaurant: restaurantInfo,
                        meal: mealInfo,
                        user: req.session.user,
                        uploadflag: false
                    });
                }
            });
            return;
        }
        else {
            // Render the page.
            res.render('attributes.ejs', {
                restaurantId: -1,
                restaurant: "",
                meal: mealInfo,
                user: req.session.user,
                uploadflag: false
            });
            return;
        }
    });
});

function overlayUserInfo(req, userInfo) {

    if(req.body.firstName != undefined) {
        userInfo.firstName = req.body.firstName.trim();
    }

    if(req.body.middleName != undefined) {
        userInfo.middleName = req.body.middleName.trim();
    }

    if(req.body.lastName != undefined) {
        userInfo.lastName = req.body.lastName.trim();
    }

    if(req.body.suffixName != undefined) {
        userInfo.suffixName = req.body.suffixName.trim();
    }

    if(req.body.streetAll != undefined) {
        userInfo.addressStreet = req.body.streetAll.trim();
    }

    if(req.body.city != undefined) {
        userInfo.addressCity = req.body.city.trim(); 
    }
    
    if(req.body.state != undefined) {
        userInfo.addressState = req.body.state.trim();
    }

    if(req.body.zip != undefined) {
        userInfo.addressZip = req.body.zip.trim();
    }

    if(req.body.phone != undefined) {
        userInfo.phone = req.body.phone.trim();
    }

    if(req.body.maxpics != undefined && req.session.user.isAdmin == true) {
        var pics = parseInt(req.body.maxpics);
        if(pics >= 0) {
            userInfo.maxPics = parseInt(req.body.maxpics);
        }
    }

    if(req.body.admin != undefined && req.session.user.isAdmin == true) {
        if(req.body.admin == "Yes") {
            userInfo.isAdmin = true;
        }
        else {
            userInfo.isAdmin = false;
        }
    }
}

app.get('/image*', function(req, res) {
//    chooseimage(req, res, 0, rotating_images);
//    if (first) {
//        fs.readdir(basedir, function(err, files) {
//            if (err) throw err;
//            global_files = files;
//            chooseimage(req, res, err, files);
//        });
//        first = 0;
//    }
//    else {
//    }
});

app.get('/', function(req, res) {
    var username;
    if( req.session.user != undefined &&
        req.session.user.username != undefined ) {
            username = req.session.user.username;
        }
    else {
        username = "";
    }

    res.render('index.ejs', { 
        title: org, 
        user: req.session.user
    });
});

app.post('/jquery', function(req, res, next) {
});

app.get('/jquery', function(req, res, next) {
    res.render('jquery.ejs', {
        addressStreet: "1234 Winter Lane; Apartment 5",
        addressCity: "Huntington",
        addressState: "NY",
        addressZip: 11111
    });
});

app.get('/signin_retry', function(req, res, next) {
    res.render('signin.ejs', {
        errmsg: 'Invalid name or password!  Please try again.'
    });
});

app.get('/signincheckpassword', function(req, res, next) {
    getuserajax(req, res, next);
});

app.get('/signin', function(req, res, next) {
    res.render('signin.ejs', {
        errmsg: ''
    });
});

function getuser_int(req, res, next, is_ajax) {
    
    var username; 
    var password; 

    if(is_ajax) {
        username = req.query.username;
        password = req.query.password;
    }
    else {
        username = req.body.username;
        password = req.body.password;
    }

    // We're trying to login: delete the current user
    if (req.session.user != undefined) {
        delete req.session.user;
    }

    // Delete any orphaned keys
    if (req.session.key != undefined) {
        delete req.session.key;
    }
    
    // See if this user is in the user's table
    getUserFromMongo(username, function(err, user) {
        if(undefined == user) {
            if(is_ajax) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({ errStr: "baduserorpassword" }));
                res.end();
            }
            else {
                res.redirect('/signin_retry');
            }
            return;
        }

        // Verify the password
        if (password != user.password) {
            if(is_ajax) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({ errStr: "baduserorpassword" }));
                res.end();
            }
            else {
                res.redirect('/signin_retry');
            }
            return;
        }

        // This user is authenticated
        req.session.user = user;

        // Update the 'lastLogin' information
        updateLastLoginInMongo(username, function(err) {} );

        if (req.session.nextpage) {
            var nextpage = req.session.nextpage;
            delete req.session.nextpage;
            if(is_ajax) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({ errStr: "", message: "signedin", nextpage: req.session.nextpage }));
                res.end();
            }
            else {
                res.redirect(nextpage);
            }
            return;
        }

        if(is_ajax) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ errStr: "", message: "signedin", nextpage: "" }));
            res.end();
        }
        else {
            res.redirect('/');
        }
        return;
    });
}

function getuser(req, res, next) {
    getuser_int(req, res, next, 0);
}

function getuserajax(req, res, next) {
    getuser_int(req, res, next, 1);
}

app.post('/signin', getuser);

app.post('/signin_retry', getuser);

// The key is req.params.id
function authenticate_resignin_get(req, res, next, message) {
    var errmessage = '';
    if (message != undefined) {
        errmessage = message;
    }
    res.render('resignin.ejs', {
        errmsg: errmessage
    });
}

var lastts = 0;
var lastdup = 0;

// What defines a restaurant
function restaurantInfo(name, username) {

    // Name of the restaurant
    this.name = name;

    // There are about 500,000 restaurants in the US .. we can use ms
    this.restaurantId = Date.now();

    // The last time it was modified is now
    this.lastModified = this.created;

    // Who added this restaurant
    this.addedBy = username;

    // Has the admin verified this index
    this.verifiedByAdmin = false;

    // Zipcode of this restaurant
    this.zip = -1;

    // Link of restaurant's homepage
    this.link = "";

    // Parent company's homepage
    this.parentLink = "";

    // Street address
    this.addressStreet = "";

    // City where restaurant is
    this.addressCity = "";

    // State where restaurant is
    this.addressState = "";

    // Country where restaurant is
    this.addressCountry = "";

    // Phone number of this restaurant
    this.phone = "";

    // Date opened
    this.dateOpened = -1;
    
    // Date closed (if closed)
    this.dateClosed = -1;
}

/* To allow order, the picInfo table could be a doubly-linked list.  The
 * mealinfo record could maintain a 'head', and each picInfo could maintain
 * a 'prev' and a 'next'.  Not great .. i/o-tastic.  */

/* Maybe this table shouldn't exist at all .. there could just be an array of 
 * picinfo objects hanging off of the mealInfo. */
function picInfo(mitimestamp, name, size, width, height, type, features) {

    this.timestamp = Date.now();

    this.picName = name;

    // Mealinfo timestamp - points to a mealinfo table entry
    this.mitimestamp = mitimestamp;

    // This is imagetype
    this.type = type;

    this.width = width;

    this.height = height;

    this.thumbwidth = -1;

    this.thumbheight = -1;

    this.features = features;
}

function updateMealInMealDate(mealdate, meal) {
}

// Given a date object and a meal const, format to YYYYMMDDmm
function dateToMealDate(date, mealconst)
{
    if(mealconst < 0 || mealconst > 99)
    {
        throw new Error("Invalid value for mealconst(" + mealconst + ").  Must be between 0 and 99");
        return;
    }

    return (               // YYYYMMDDmm
        (date.getFullYear()    * 1000000) +
        ((date.getMonth() + 1)   * 10000) +
        (date.getDate()            * 100) +
        (mealconst)
    );
}

// Given YYYYMMDDmm, return a date object corresponding to YYYYMMDD
// I might not need this
function mealDateToDate(mealdate)
{
    var year = mealdate / 1000000; mealdate %= 1000000;
    var month = mealdate /  10000; mealdate %=   10000;
    var day  = mealdate /     100;
    return new Date( year, month-1, day);
}

// Create an empty mealinfo object with default attributes.
function mealInfo(user) {

    // Username of creator
    this.userid = user.userid;

    // Time when created 
    this.timestamp = Date.now();

    // Time when eaten in 'YYYYMMDDmm' syntax, where the final 'mm' is a two-digit 
    // code which represents when the meal was consumed (see the 'enums' above).
    // I'm doing it this way so that I can still use basically the same paging-
    // code in mongo db (so I can search for something >= YYYYMMDDmm or something 
    // <= YYYYMMDDmm.  
    //
    // I'm having difficulty allowing users to specify more than a single meal for
    // a given day, because you can't really create an index which fits that 
    // criteria.  Here's the problem in a nutshell:
    //
    // I would like to be able to start at this record:
    //
    // YYYYMMDDmm + timestamp
    //
    // And I would like to walk this index, and retrieve 'N' records which are 
    // greater than (or less than) that.  How do I specify this in mongo?
    //
    // ANSWER!
    //
    // I can say 'where YYYYMMDDmm >= (blah)', but I can just not start counting
    // until I reach 'timestamp' ..
    //
    // *OR* I could add yet even more to the unique 'mealDate' variable:
    //
    // The bad thing about this code is that to load a mealinfo, I'll end up 
    // making multiple database hits: one for the first mealinfo, another for the
    // pictures.  One possibly solution is to keep a simple number-array of
    // the pictures in mealinfo.  My fear is that this will get out of sync:
    // mongodb doesn't allow transactions across tables.  But probably this would
    // not happen.  If I *did* do a simple number array in the mealinfo table, I 
    // should limit the number of pictures per meal to something low: 32, maybe.
    //
    // This might be premature optimization.  Cut one, live with multiple db
    // hits to see if its a real problem.
    //
    // Another issue: I need to send all of the picinfo information for every 
    // mealinfo that I have.  I can send editmeals.ejs a mealinfo object which 
    // contains an array of the associated picinfos.  On the editmeals page I 
    // could optimize a bit and show only the first 4 or 5 stacked on top of each 
    // other.  So it will be a first class entry in the picinfo table rather than 
    // a list of numbers hanging off of a mealinfo.  To find all of the picinfos 
    // which correspond to a mealinfo, I'll have to do a search.

    // What meal was this (breakfast, lunch, dinner, other)
    this.meal = "lunch"; 

    // YYYYMMDDmm (where 'mm' is the const for 'lunch')
    this.mealDate = dateToMealDate(new Date(), LUNCH);

    // Initialize picInfo to an empty array.
    this.picInfo = [];

    this.title = "";

    // Whether this has been published
    this.published = false;

    // Whether this has been verified for public consumption
    // This is prolly not the way to go with this.
    this.verifiedByAdmin = false;

    // Admins ruling
    this.adminAllow = false;

    // Maybe I'll have some sort of global ranking .. will think about this
    this.ranking = 0;
    this.rating = -1;
    this.whenDeleted = 0;
    this.deleted = false;

    // Maximum pics per single meal
    // this.maxPicsPerMeal = defaultMaxPicsPerMeal;

    // Restaurant: reference to the restaurants table
    this.restaurantId = -1;

    // What does this user have to say about this
    this.review = "";

    // The user hasn't submitted anything yet
    this.tmpReview = "";
}

// These are all the same
function mealrecord(newobj, userid, picInfo, imageType) {
    newobj.userid = userid;
    newobj.timestamp = picInfo.timestamp;
    newobj.mitimestamp = picInfo.mitimestamp;
    newobj.imageType = imageType;
    newobj.published = false;
}

function mealRecord(userid, picInfo, imageType) {
    mealrecord(this, userid, picInfo, imageType);
}

// Create a mealicon object for mongo.
function mealIcon(userid, picInfo, image, imageType) {
    mealrecord(this, userid, picInfo, imageType);
    this.image = image;
}

// Create a thumbnail object for mongo.
function mealThumb(userid, picInfo, image, imageType) {
    mealrecord(this, userid, picInfo, imageType);
    this.image = image;
}

// Create a pic object for mongo
function mealPic(userid, picInfo, image, imageType) {
    mealrecord(this, userid, picInfo, imageType);
    this.image = image;
}

// Common function to deal with authenticate resignin posts
function authenticate_resignin_post(req, res, next) {

    // Zap the user
    if (req.session.user != undefined) {
        delete req.session.user;
    }

    // If is isn't defined something weird is happeneing.
    if (undefined == req.params.id) {
        res.redirect('/');
        return;
    }

    // Verify that this username matches what's in the session key
    redisClient.get(req.params.id, function(err, reply) {

        if (err){
            throw (err);
        }

        // Did we find this
        if (undefined == reply) {
            res.redirect('/');
            return;
        }

        // Parse the stringified user
        var tmpuser = JSON.parse(reply);

        // Make sure the username matches
        if (tmpuser.username != username) {
            res.redirect('/authenticate_bad_signin/' + req.params.id);
            return;
        }
        // Make sure the password matches
        if (tmpuser.password != password) {
            res.redirect('/authenticate_bad_signin/' + req.params.id);
            return;
        }

        // Allocate a full-fledged user object
        // var user = new User(tmpuser.username, tmpuser.password);

        // Add to the user's table
        setNewUserInMongo(tmpuser.username, tmpuser.password, function(err, user) {

            // Create an error page possibly?
            if(err) {
                res.redirect('/');
                return;
            }

            // Generate a logfile message
            wrlog(log, "Authenticated new user " + tmpuser.username + " as userid " + tmpuser.userid);

            // Delete the key
            redisClient.del(req.params.id, function(err, reply) {} );

            // Make the session user-aware
            req.session.user = user;

            // Nextpage shouldn't survive a login
            if (req.session.nextpage) {
                delete req.session.nextpage;
            }

            res.redirect('/');
            return;
        });
    });
}


app.post('/authenticate_bad_signin/:id', authenticate_resignin_post);
app.post('/authenticate_resignin_password_mismatch/:id', authenticate_resignin_post);
app.post('/authenticate_resignin/:id', authenticate_resignin_post);

// get functions for the authenticate newaccount pages.
app.get('/authenticate_resignin/:id', function(req, res, next) {
    authenticate_resignin_get(req, res, next);
});

app.get('/authenticate_error/:id', function(req, res, next) {
    authenticate_resignin_get(req, res, next, 'There was an error!');
});

app.get('/authenticate_bad_signin/:id', function(req, res, next) {
    authenticate_resignin_get(req, res, next, 'Bad username or password!');
});

app.get('/authenticate_resignin_password_mismatch/:id', function(req, res, next) {
    authenticate_resignin_get(req, res, next, 'Passwords did not match');
});

function forgot_password_get(req, res, next, message) {
    var errmessage = '';
    if (message != undefined) {
        errmessage = message;
    }
    res.render('forgot_password.ejs', {
        errmsg: errmessage
    });
}

// TODO: tie each of these into more logical 'file' units.
// Maybe there could be a node.js source file per ejs file?
app.get('/forgot_password_nouser', function(req, res, next) {
    forgot_password_get(req, res, next, 'User does not exist');
});

app.get('/forgot_password_bademail', function(req, res, next) {
    forgot_password_get(req, res, next, 'Invalid email address');
});

app.get('/forgot_password_sentmail', function(req,res,next) {
    if( debug ) {
        res.render('sendforgotpasswordmail.ejs', {
            user: req.body.username,
            key: req.session.key
        });
    }
    else {
        res.render('sendforgotpasswordmail.ejs', {
            user: req.body.username,
            key: ''
        });
    }
});

app.get('/forgot_password', function(req, res, next) {
    forgot_password_get(req , res, next);
});


// Unified 'post' function for verifying the user's email
function forgot_password_post(req, res, next) {

    // If the username isn't a valid email address, punt
    var regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9._%+-]+\.[A-Za-z0-9._%+-]{1,16}$/;

    // Strip leading and trailing spaces.
    req.body.username = req.body.username.replace(/(^\s*)|(\s*$)/gi,"");

    // Make sure its a sane length
    if (req.body.username.length > 256) {
        res.redirect('/forgot_password_nouser');
        return;
    }

    // Verify email format.
    if (!regex.test(req.body.username)) {
        res.redirect('/forgot_password_bademail');
        return;
    }

    // Make sure this user exists
    getUserFromMongo(req.body.username, function(err, user) {
        
        // Punt if there's an error
        if(err) {
            console.log('Error with getUserFromMongo.');
            throw(err);
        }

        // If this is null then this user doesn't have an account
        if(undefined == user) {
            res.redirect('/forgot_password_nouser');
            return;
        }

        var rand;
        var seed;
        var key;
        var userString;
        var link;

        // Generate unique number
        seed = (Date.now() - Date.UTC(2012,0,1)) * 100;
        rand = Math.floor(Math.random() * 100);
        seed += rand;

        // Prepend with a little randomness
        rand = Math.floor(Math.random() * 65536);

        // Convert the first part to hex
        prev = rand.toString(16);

        // Convert seed to hex
        hexseed = seed.toString(16);

        // Create a key
        key = "P".concat(prev).concat(hexseed);

        // Coerce the user into a string
        userString = JSON.stringify(user);

        // Add this to redis
        redisClient.set(key, userString, function(err, reply){

            if(err) throw(err);

            // Give this key a timeout of 2 hours.
            redisClient.expire(key, 7200, function(){});

            var from = 'noreply@' + org;
            var subject = org + ' password reset';

            // Send a validation message
            mailer.sendMail({
                from:       from,
                to:         req.body.username,
                subject:    subject,
                text:
                'You have requested to reset your ' +
                org + ' password.  To do so, please copy and paste this into your ' +
                'favorite browser:\n' +
                webBase + '/resetpassword/' + key + '\n\n' + 
                'Thank you for using ' + org + '!\n',
                html:       
                '<html><head><title>' + org +
                '</title></head>' +
                'You have requested to reset your ' +
                org + ' password.  To do so, please click (or copy and paste) this: ' +
                '<a href=\'' + webBase + '/resetpassword/' + key +
                '\'>' + webBase + '/resetpassword/' + key + '</a>.<br><br>' +
                'Thank you for using ' + org + '!'
            }, function(err, result) {
                req.session.tmpusername = req.body.username;
                if(err) {
                    res.redirect('/mailerror');
                }
                else {
                    req.session.key = key;
                    res.redirect('/sentreset');
                }
            });
        });
    });
}

app.post('/forgot_password', forgot_password_post);
app.post('/forgot_password_error', forgot_password_post);
app.post('/forgot_password_bademail', forgot_password_post);
app.post('/forgot_password_nouser', forgot_password_post);

// 
function resetuserpassword_get(req, res, next, message) {
    var errmessage = '';
    
    // Set error message
    if (message != undefined) {
        errmessage = message;
    }

    // Redirect to start page if anything wacky is happening
    if (req.session.resetuser == undefined) {

        // Redirect to main page.
        res.redirect('/');
    }

    // Show the reset-password page
    res.render('resetuserpassword.ejs', {
        errmsg: errmessage
    });
}

function changePasswordGetUser(req, res, next, targetUser, message)
{
    var changeMessage = (message == undefined)?"":message;
    res.render('changepassword.ejs', {
        printReset: false,
        message: changeMessage,
        editUser: req.session.user,
        user: targetUser
    });
}

function changePasswordGet(req, res, next, username) {
    if(username == req.session.user.username) {
        changePasswordGetUser(req, res, next, req.session.user);
        return;
    }
    else if(req.session.user.isAdmin != true) {
        res.redirect('/');
        return;
    }
    else {
        getUserFromMongo(username, function(err, foundUser) {
            if(err) throw(err);
            if(undefined == foundUser) {
                console.log('Attempt to change password for a non-existant user?');
                console.log('Username: ' + username);
                console.log('Modifying User: ' + req.session.user.username);
                res.redirect('/');
                return;
            }
            changePasswordGetUser(req, res, next, foundUser);
            return;
        });
    }
}

app.get('/changepassword', function(req, res, next) {
    if(req.session.user == undefined) {
        req.session.nextpage = '/account';
        res.redirect('/signin');
        return;
    }

    changePasswordGet(req, res, next, req.session.user.username);
});

function checkChangePasswordUser(req, res, next, user) {
    var currentPassword = req.query.currentPassword;
    var newPassword = req.query.newPassword;
    var regex = /^[a-zA-Z0-9_.]{6,64}$/;

    if(user.password != currentPassword) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ errStr: "incorrectpassword" }));
        res.end();
        return;
    }

    if(!regex.test(newPassword)){
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ errStr: "badpasswordformat" }));
        res.end();
        return;
    }

    updatePasswordInMongo(user.username, newPassword, function(err) {
        if(err) throw(err);

        if(req.session.user.username == user.username) {
            req.session.user.password = newPassword;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ errStr: "", message: "passwordChanged" }));
        res.end();
        return;
    });
}

app.post('/updateposition', function(req, res, next) {

    // Boilerplate user checking
    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "baduser"}));
        res.end();
        return;
    }

    if(req.body.username == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }

    var userid = parseInt(req.body.username);

    if(userid != req.session.user.userid) {
        console.log('mismatched userids in savereview request:');
        console.log('session userid is ' + req.session.user.userid);
        console.log('request userid is ' + userid);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "baduser"}));
        res.end();
        return;
    }

    // Ratelimit position updates
    if(req.session.last_updatepos != undefined &&
            (Date.now() - req.session.last_updatepos) < posUpdateMs) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "toosoon"}));
        res.end();
        return;
    }

    req.session.last_updatepos = Date.now();

    // Save: autocomplete will prefer this to geoip information
    req.session.user.position = req.body.position;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({message: "success"}));
    res.end();
    return;
});

app.post('/savereview', function(req, res, next) {

    var userid = parseInt(req.body.username, 10);

    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "baduser"}));
        res.end();
        return;
    }
    if(req.body.username == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }
    if(userid != req.session.user.userid) {
        console.log('mismatched userids in savereview request:');
        console.log('session userid is ' + req.session.user.userid);
        console.log('request user is ' + userid);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "baduser"}));
        res.end();
        return;
    }
    if(req.body.timestamp == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }
    // not sure if this makes sense .. hopefully it will mitigate the affects of 
    // a denial of service attack.
    /*
    if(req.session.last_saveinfo != undefined &&
            (Date.now() - req.session.last_saveinfo) < infoUpdateMs) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "toosoon"}));
        res.end();
        return;
    }
    */

    req.session.last_saveinfo = Date.now();

    updateReviewInMongo(userid, parseInt(req.body.timestamp), req.body.review,
            function(err) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                if(err) {
                    res.write(JSON.stringify({errStr: "dberror"}));
                }
                else {
                    res.write(JSON.stringify({message: "saved"}));
                }
                res.end();
            });


});

// Update key picture handler
app.post('/updatekeypic', function(req, res, next) {

    var userid = parseInt(req.body.username, 10);

    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "baduser"}));
        res.end();
        return;
    }
    if(req.body.username == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }
    if(userid != req.session.user.userid) {
        console.log('mismatched usernames in saverating request:');
        console.log('session user is ' + req.session.user.username);
        console.log('request user is ' + req.body.username);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "baduser"}));
        res.end();
        return;
    }

    if(req.body.mealts == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }

    if(req.body.keyts == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }

    req.session.last_saveinfo = Date.now();

 //   try {
        updateKeyPicInMongo(
                userid, 
                parseInt(req.body.mealts, 10), 
                parseInt(req.body.keyts, 10), 
                function(err) {
                    // If there was an error, it would have been thrown by now
                    if(err) throw (err);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify({message: "badrequest"}));
                    res.end();
                    return;
                }
        );
//    }
        /*
    catch(err) {
        console.log('caught error');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "dberror"}));
        res.end();
        return;
    }
    */
});

app.post('/deletepic', function(req, res, next) {

    var userid = parseInt(req.body.username, 10);

    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "baduser"}));
        res.end();
        return;
    }
    if(req.body.username == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }
    if(userid != req.session.user.userid) {
        console.log('mismatched usernames in saverating request:');
        console.log('session userid is ' + req.session.user.userid);
        console.log('request userid is ' + req.body.username);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "baduser"}));
        res.end();
        return;
    }

    if(req.body.timestamp == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }

    if(req.body.mealts == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }

    req.session.last_saveinfo = Date.now();

    deletePicFromMongo(userid, parseInt(req.body.mealts, 10), parseInt(req.body.timestamp, 10), function(err) {
        if(err) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({message: "dberror"}));
            res.end();
            return;
        }
        // Success!
        else {

            // Update outstanding number of pictures for this user
            req.session.user.numPics--;

            updateCurrentNumPicsInMongo(req.session.user.username, req.session.user.numPics, function(err) { 
                if(err) throw(err);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({message: "success"}));
                res.end();
                return;
            });
        }
    });
});

app.post('/saverating', function(req, res, next) {

    var userid = parseInt(req.body.username, 10);

    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "baduser"}));
        res.end();
        return;
    }
    if(req.body.username == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }
    if(userid != req.session.user.userid) {
        console.log('mismatched usernames in saverating request:');
        console.log('session userid is ' + req.session.user.userid);
        console.log('request userid is ' + req.body.username);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "baduser"}));
        res.end();
        return;
    }
    if(req.body.timestamp == undefined || parseInt(req.body.timestamp) <= 0) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }
    // not sure if this makes sense .. hopefully it will mitigate the affects of 
    // a denial of service attack.
    /*
    if(req.session.last_saveinfo != undefined &&
            (Date.now() - req.session.last_saveinfo) < infoUpdateMs) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "toosoon"}));
        res.end();
        return;
    }
    */

    req.session.last_saveinfo = Date.now();

    updateRatingInMongo(userid, parseInt(req.body.timestamp), parseInt(req.body.rating),
            function(err) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                if(err) {
                    res.write(JSON.stringify({errStr: "dberror"}));
                }
                else {
                    res.write(JSON.stringify({message: "saved"}));
                }
                res.end();
            });
});



app.post('/savemeal', function(req, res, next) {


    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "baduser"}));
        res.end();
        return;
    }
    if(req.body.username == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }

    var userid = parseInt(req.body.username, 10);

    if(userid != req.session.user.userid) {
        console.log('mismatched usernames in savemeal request:');
        console.log('session user is ' + req.session.user.userid);
        console.log('request user is ' + req.body.username);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "baduser"}));
        res.end();
        return;
    }
    if(req.body.timestamp == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }
    // not sure if this makes sense .. hopefully it will mitigate the affects of 
    // a denial of service attack.
    /*
    if(req.session.last_saveinfo != undefined &&
            (Date.now() - req.session.last_saveinfo) < infoUpdateMs) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "toosoon"}));
        res.end();
        return;
    }
    */

    req.session.last_saveinfo = Date.now();

    // This should also update the meal's calendar timestamp
    try
    {
        updateMealInMongo(req.body.username, parseInt(req.body.timestamp), 
                req.body.meal, function(err) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            if(err) {
                res.write(JSON.stringify({errStr: "dberror"}));
            }
            else {
                res.write(JSON.stringify({message: "saved"}));
            }
            res.end();
        });
    }
    catch(err)
    {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }
});

// 'savetitle' now applied to picInfo rather than mealInfo
app.post('/savetitle', function(req, res, next) {

    var userid = parseInt(req.body.username, 10);

    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "baduser"}));
        res.end();
        return;
    }
    if(req.body.username == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }
    if(userid !== req.session.user.userid) {
        console.log('mismatched usernames in savetitle request:');
        console.log('session userid is ' + req.session.user.userid);
        console.log('request userid is ' + req.body.username);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "baduser"}));
        res.end();
        return;
    }
    if(req.body.timestamp == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }
    // not sure if this makes sense .. hopefully it will mitigate the affects of 
    // a denial of service attack.
    /*
    if(req.session.last_saveinfo != undefined &&
            (Date.now() - req.session.last_saveinfo) < infoUpdateMs) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "toosoon"}));
        res.end();
        return;
    }
    */

    req.session.last_saveinfo = Date.now();

    updateTitleInMongo(userid, parseInt(req.body.timestamp), req.body.title,
            function(err) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                if(err) {
                    res.write(JSON.stringify({errStr: "dberror"}));
                }
                else {
                    res.write(JSON.stringify({message: "saved"}));
                }
                res.end();
            });
});

// Mongo is supposed to be fast - go ahead and hit the database
app.post('/savereviewtmp', function(req, res, next) {
    var timestamp;
    
    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "okay"}));
        res.end();
        return;
    }
    if(req.body.username == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "okay"}));
        res.end();
        return;
    }
    if(req.body.username != req.session.user.username) {
        console.log('mismatched usernames in savereviewtmp request:');
        console.log('session user is ' + req.session.user.username);
        console.log('request user is ' + req.body.username);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "okay"}));
        res.end();
        return;
    }
    if(req.body.timestamp == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "okay"}));
        res.end();
        return;
    }

    // Getting rid of this logic for now- it could drop information
/*
    if(req.session.last_savereviewtmp != undefined && 
            (Date.now() - req.session.last_savereviewtmp) < tmpReviewUpdateMs) {
        console.log('dropping early *' + req.body.source + '* tmpreview for user ' + 
                req.body.username + ' timestamp ' + req.body.timestamp);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "okay"}));
        res.end();
        return;
    }
*/

    req.session.last_savereviewtmp = Date.now();

    updateTmpReviewInMongo(req.body.username, parseInt(req.body.timestamp), req.body.textarea, 
        function(err) { 
            /*
            console.log('updated *' + req.body.source + '* tmpreview for user ' + 
                req.body.username + ' timestamp ' + req.body.timestamp);
            */
            res.writeHead(200, { 'Content-Type': 'application/json' });
            if(err) {
                res.write(JSON.stringify({message: "error"}));
            }
            else {
                res.write(JSON.stringify({message: "saved"}));
            }
            res.end();
        }
    );
});

// Ajax request to get meal information
app.get('/ajaxgetmealinfo', function(req, res, next) {

    var username = parseInt(req.query.username);
    var timestamp = parseInt(req.query.timestamp);
    var picArray = [];

    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ errStr: "baduser" }));
        res.end();
        return;
    }

    if(req.session.user.userid != username && req.session.user.isAdmin == false) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ errStr: "wronguser" }));
        res.end();
        return;
    }

    // Either admin or normal case, lookup mealinfo 
    getOneMealInfoFromMongoReview(username, timestamp, function(err, mealInfo) {
        if(err) throw(err);
        if(undefined == mealInfo) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ errStr: "nomeal" }));
            res.end();
            return;
        }

        // This code is on hold for now
        if(mealInfo.restaurantId > 0) {
            getRestaurantInfoById(mealInfo.restaurantId, function(err, restaurantInfo) {
                if(err) throw(err);
                if(undefined == restaurantInfo) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify(
                            { 
                                errStr: "",
                                mealInfo: mealInfo,
                                restaurantId: -1,
                                restaurantInfo: ""
                            })
                        );
                    res.end();
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify(
                        { 
                            errStr: "",
                            mealInfo: mealInfo,
                            restaurantId: mealInfo.restaurantId,
                            restaurantInfo: restaurantInfo
                        })
                    );
                res.end();
                return;
            });



        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(
                        { 
                            errStr: "",
                            mealInfo: mealInfo,
                            restaurantId: -1,
                            restaurantInfo: ""
                        })
                    );
            res.end();
            return;
        }
    });
});

// I can delete this i think
function editpagenextprev(req, res, userid, next, timestamp, isprev) {
    // No real need to pass this back and forth...
    var count = parseInt(req.query.count, 10);
    var ts;

    // Should be an initial query.
    //if(mealDate == -1) {
    if(timestamp <= 0)
        ts = Date.now();
    else
        ts = timestamp;
    //}
    //else {
    //    ts = timestamp;
    //}

    if(isprev == false) {

        getMealInfoFromMongoRevMenu(userid, ts, count, false, 
                function(err, mealinfo, nextts, prevts) {

            // Add a hex-id to each of my mealinfos
            if(mealinfo.length == 0) {

                // Huh?  We shouldn't really get here
                console.log('Illogical state in editpagenextprev: next record not found?');
                // md = dateToMealDate(new Date(), MAXMEAL);

                getMealInfoFromMongoRevMenu(userid, ts, count, false, 
                    function(err, mealinfo, nextts, prevts) {

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify(
                            {
                                message: "success",
                                mealinfo: mealinfo,
                                //nextmd: nextmd,
                                nextts: nextts,
                                //prevmd: prevmd,
                                prevts: prevts
                            }));
                    res.end();
                    return;
                });
            }
            else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify(
                            {
                                message: "success",
                                mealinfo: mealinfo,
                                //nextmd: nextmd,
                                nextts: nextts,
                                //prevmd: prevmd,
                                prevts: prevts
                            }));
                res.end();
                return;
            }
        });
    }
    else { // isprev == true

        getMealInfoFromMongoFwdMenu(userid, ts, count, false, 
                function(err, mealinfo, nextts, prevts) {

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(
                    {
                        message: "success",
                        mealinfo: mealinfo,
                        //nextmd: nextmd,
                        nextts: nextts,
                        //prevmd: prevmd,
                        prevts: prevts
                    }));
            res.end();
        }); // getMealInfoFromMongoFwd
    }
}

function editpagenextprevstart(req, res, next, timestamp, isprev) {

    var userid = parseInt(req.query.username, 10);

    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "baduser"}));
        res.end();
        return;
    }

    if(req.query.username == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "baduser"}));
        res.end();
        return;
    }

    if(userid != req.session.user.userid) {
        console.log('mismatched usernames in editpagenext request:');
        console.log('session user is ' + req.session.user.userid);
        console.log('request user is ' + userid);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "baduser"}));
        res.end();
        return;
    }

    editpagenextprev(req, res, userid, next, timestamp, isprev);
}

// Do the 'nextpage' & lookup picture logic first.
app.get('/deletemeal', function(req, res, next) {

    /*
    if(req.query.prevmd == undefined || req.query.prevts == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "badrequest"}));
        res.end();
        return;
    }

    if(req.query.nextmd == undefined || req.query.nextts == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "badrequest"}));
        res.end();
        return;
    }
    */

    var userid = parseInt(req.query.username, 10);

    if(req.query.count == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "badrequest"}));
        res.end();
        return;
    }
    
    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "signin"}));
        res.end();
        return;
    }

    if(req.session.user.userid != userid) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "signin"}));
        res.end();
        return;
    }

    if(req.query.timestamp == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "badrequest"}));
        res.end();
        return;
    }

    //var nextmd = parseInt(req.query.nextmd, 10);
    var nextts = parseInt(req.query.nextts, 10);
    //var prevmd = parseInt(req.query.prevmd, 10);
    var prevts = parseInt(req.query.prevts, 10);

    var timestamp = parseInt(req.query.timestamp, 10);
    var count = parseInt(req.query.count, 10);

    setDeleteFlagInMongo(userid, timestamp, function(err, record, updated) {

        // Items in the trash can will be purged to make room for new pictures.  The 
        // dumb way to implement this is to only show the last X deleted things in 
        // reverse order of the time they're deleted.

        if(err) throw(err);
        if(record && record.picInfo) {
            req.session.user.numPics -= record.picInfo.length;
            if(req.session.user.numPics < 0) {
                wrlog(log, "Error!  Numpics is " + req.session.user.numPics + " for userid " + 
                    userid + ", resetting to 0", true);
                req.session.user.numPics = 0;
            }
        }
        updateCurrentNumPicsInMongo(req.session.user.username, req.session.user.numPics, function(err) {
            if(err) throw(err);

            // I could probably run this code asynchronous to the delete to 
            // gain a little performance- the risk is that the user will 
            // page around a bit, and see the deleted record. 
            if(prevts > 0) {
                getMealInfoFromMongoFwdMenu(
                    userid,
                    //prevmd,
                    prevts,
                    count, 
                    false, 
                    function(err, mealinfo, nextts, prevts) {

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.write(JSON.stringify(
                                {
                                    message: "success",
                                    mealinfo: mealinfo,
                                    //nextmd: 0,
                                    nextts: 0,
                                    //prevmd: prevmd,
                                    prevts: prevts
                                }));
                        res.end();
                    }); // getMealInfoFromMongoFwd
            }
            else {

                // We're authenticated.. get the nextpage mealinfo.
                getMealInfoFromMongoRevMenu(
                        userid,
                        //nextmd, 
                        nextts,
                        count, 
                        false, 
                        function(err, mealinfo, nextts, prevts) {

                            if(err) throw(err);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.write(JSON.stringify(
                                    {
                                        message: "success",
                                        mealinfo: mealinfo,
                                        //nextmd: nextmd,
                                        nextts: nextts,
                                        //prevmd: 0,
                                        prevts: 0
                                    }
                                    )
                                );
                            res.end();
                            return;
                        }
                );
            }
        });
    });
});

app.get('/editpageprev', function(req, res, next) {
    if(req.query.prevts == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "badrequest"}));
        res.end();
        return;
    }
    editpagenextprevstart(req, res, next, parseInt(req.query.prevts, 10), true);
});

// Ajax get info
app.get('/editpagenext', function(req, res, next) {
    if(req.query.nextts == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "badrequest"}));
        res.end();
        return;
    }
    editpagenextprevstart(req, res, next, parseInt(req.query.nextts, 10), false);
});

// Ajax check & change password request
app.get('/checkchangepassword', function(req, res, next) {
    var username = req.query.username;
    if(req.session.user == undefined) {
        req.session.nextpage = '/changepassword';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ errStr: "signin" }));
        res.end();
        return;
    }

    if(req.session.user.username != username && req.session.user.isAdmin == false) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ errStr: "wronguser" }));
        res.end();
        return;
    }

    if(req.session.user.username == username) {
        checkChangePasswordUser(req, res, next, req.session.user);
        return;
    }

    // Admin case: look up this user in mongodb
    getUserFromMongo(username, function(err, user) {
        if(err) throw (err);
        if(user == undefined) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ errStr: "nonexistantuser" }));
            res.end();
            return;
        }
        checkChangePasswordUser(req, res, next, user);
        return;
    });
});

// It turns out I don't need these post requests .. 
// don't need this delete it
function changePasswordPostUser(req, res, next, user) {
    // Verify that the current password is correct for a non-admin user
    if(
            (undefined != user.password) && 
            ("" != user.password) &&
            (user.password != req.body.currentPassword) && 
            (req.session.user.isAdmin == false)
      )
    {
        res.render('changepassword.ejs', {
            printReset: true,
            message: "Incorrect password for user",
            editUser: req.session.user,
            user: user
        });
        return;
    }

    // Double check jquery - make sure that the passwords are the correct format
    var regex = /^[a-zA-Z0-9_.]{6,64}$/;

    if(!regex.test(req.body.newPassword) && req.session.user.isAdmin == false) {
        res.render('changepassword.ejs', {
            printReset: true,
            message: "New pasword should be between 6 and 64 alphanumeric characters",
            editUser: req.session.user,
            user: user
        });
        return;
    }

    // Make sure that the password and check-password match each other (another jquery double-check)
    if(req.body.newPassword != req.body.newPasswordCheck) {
        res.render('changepassword.ejs', {
            printReset: true,
            message: "New passwords do not match",
            editUser: req.session.user,
            user: user
        });
        return;
    }

    // Everything seems on the up & up - update mongo
    updatePasswordInMongo(user.username, req.body.newPassword, function(err) {
        // TODO - this shouldn't happen, but if it DOES, I need to display something
        // reasonable to the user
        if(err) throw(err);

        // Success 
        if(req.session.user.username == user.username) {
            req.session.user.password = req.body.newPassword;
        }

        // Return to the accountEdit page
        res.redirect('/accountedit');

    });
}

// don't need this delete it
function changePasswordPost(req, res, next, username) {
    if(username == req.session.user.username) {
        changePasswordPostUser(req, res, next, req.session.user);
        return;
    }
    else if(req.session.user.isAdmin != true) {
        res.redirect('/');
        return;
    }
    else {
        getUserFromMongo(username, function(err, targetUser) {
            if(err) throw(err);
            if(targetUser == undefined) {
                console.log('Attempt to change password for a non-existant user in post request?');
                console.log('Username: ' + username);
                console.log('Modifying User: ' + req.session.user.username);
                res.redirect('/');
                return;
            }
            changePasswordPostUser(req, res, next, targetUser);
            return;
        });
    }
}

// don't need this delete it
app.post('/changepassword', function(req, res, next) {
    if(req.session.user == undefined) {
        req.session.nextpage = '/changepassword';
        res.redirect('/signin');
        return;
    }

    changePasswordPost(req, res, next, req.session.user.username);
});

// don't need this delete it
app.post('/changepassword/:username', function(req, res, next) {
    if(req.session.user == undefined) {
        req.session.nextpage = '/changepassword/' + req.params.username;
        res.redirect('/signin');
        return;
    }

    changePasswordPost(req, res, next, req.params.username);
});

app.get('/resetuserpassword', function(req, res, next) {
    resetuserpassword_get(req, res, next);
});

app.get('/resetuserpassword_password_mismatch', function(req, res, next) {
    resetuserpassword_get(req, res, next, 'Passwords did not match');
});

app.get('/resetuserpassword_bad_password', function(req, res, next) {
    resetuserpassword_get(req, res, next, 
        'Password must be between 6 and 64 alpha-numeric characters');
});

// Unified 'post' function for resetting the user password
function resetuserpassword_post(req, res, next) {

    var regex = /^[a-zA-Z0-9_.]{6,64}$/;
    var username;

    // Check for sanity
    if (!regex.test(req.body.password)) {
        res.redirect('/resetuserpassword_bad_password');
        return;
    }

    // Check for matching passwords
    if (req.body.password != req.body.password_check) {
        res.redirect('/resetuserpassword_password_mismatch');
        return;
    }

    // Reset user isn't set
    if (undefined == req.session.resetuser) {
        res.redirect('/');
    }

    // Grab the username
    username = req.session.resetuser.username;

    // Make sure this user exists
    getUserFromMongo(username, function (err, user) {

        var resetuser; 

        // Throw down
        if(err) throw (err);

        // Shouldn't happen
        if(undefined == user) {

            console.log('Cannot find a user in mongo:' + req.session.resetuser);
            res.redirect('/');
            return;

        }
        
        // Latch the resetuser
        resetuser = req.session.resetuser;

        // Delete it from our session
        delete req.session.resetuser;

        // We have a password and a user- let's update mongo!
        updatePasswordInMongo(username, req.body.password, function(err) {
            if(err) {
                console.log('There was an error updating mongo for ' + req.session.resetuser.username);
                res.redirect('/');
                return;
            }

            // Make sure my local image has a reset password also
            resetuser.password = req.body.password;

            // Log this user in
            req.session.user = resetuser;

            // Display the password-has-been-changed page
            res.redirect('/changed_password');
        });
    });
}

app.get('/changed_password', function(req, res, next) {
    res.render('changed_password.ejs');
});

// Print out the user
app.post('/resetuserpassword', function(req, res, next) {
    resetuserpassword_post(req, res, next);
});

app.post('/resetuserpassword_password_mismatch', function(req, res, next) {
    resetuserpassword_post(req, res, next);
});

app.post('/resetuserpassword_bad_password', function(req, res, next) {
    resetuserpassword_post(req, res, next);
});

// Unified 'get' function for the reset-password page
function resetpassword_get(req, res, next, message) {

    // Delete the user if they exist
    if (req.session.user != undefined) {
        delete req.session.user;
    }

    // Delete the 'resetuser' if they exist
    if (req.session.resetuser != undefined) {
        delete req.session.resetuser;
    }

    // We don't care about the session key here
    if (req.session.key != undefined) {
        delete req.session.key;
    }

    // Find this 
    redisClient.get(req.params.id, function(err, reply) {

        // Throw any errors we've gotten
        if (err) {
            throw (err);
        }

        // Verify that we got a reply.. maybe this timed out?
        if (reply == undefined) {

            // Log this attempt
            console.log('Redis can\'t find reset attempt .. timed out?\n');
            console.log('ID: ' + req.params.id);
            res.redirect('/');
            return;

        }

        // Parse the stringified user
        var user = JSON.parse(reply);

        // This shouldn't be defined here
        if(req.session.key != undefined) {
            delete req.session.key;
        }

        // Lookup this user in mongo
        getUserFromMongo(user.username, function(err, resetuser) {

            // Shouldn't happen unless maybe the account is deleted?
            if(undefined == user) {

                // Log this attempt
                console.log('Attempt to reset password for non-existant user?');
                console.log('Username: ' + user.username);
                res.redirect('/');
                return;

            }

            // Set resetuser.  Don't sign in until the password change.
            req.session.resetuser = resetuser;

            // Send to reset-password page
            res.redirect('/resetuserpassword');

            return;
        });
    });
}

app.get('/resetpassword/:id', function(req, res, next) {
    resetpassword_get(req, res, next);
});

app.get('/authenticate/:id', function(req, res, next) {

    redisClient.get(req.params.id, function(err, reply) {
        if (err || null==reply) {
            res.redirect('/');
            // Just throw it for now.
            //throw (err);
            // app.redirect('/authenticate_error');
        }
        else {
            // Parse the stringified user
            var tmpuser = JSON.parse(reply);
            var key;

            if(req.session.key != undefined) {
                key = req.session.key;
                delete req.session.key;
            }

            // Key matches session key: add this person to users table
            if(key == req.params.id) {

                // Get a new user object
                // var user = new User(tmpuser.username, tmpuser.password);

                // Add to mongo user's table
                setNewUserInMongo(tmpuser.username, tmpuser.password, function(err, user) {

                    // Create an error page possibly?
                    if (err) {
                        res.redirect('/');
                        return ;
                    }

                    // Delete the key
                    redisClient.del(req.params.id, function(err, reply) {} );

                    // Make the session user-aware
                    req.session.user = user;

                    // Generate a logfile message
                    wrlog(log, "Authenticated new user " + tmpuser.username + " as userid " + tmpuser.userid);

                    // Send to nextpage if needed
                    if (req.session.nextpage) {
                        var nextpage = req.session.nextpage;
                        delete req.session.nextpage;
                        res.redirect(nextpage);
                    }

                    // Just send home
                    else {
                        res.redirect('/');
                    }
                });
            }
            else {
                // Store the user in our session 
                res.redirect('/authenticate_resignin/' + req.params.id);
            }
        }
    });
});

// Common post function for newaccount pages
function newaccount_post(req, res, next) {
    // If the username isn't a valid email address, punt
    var regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9._%+-]+\.[A-Za-z0-9._%+-]{1,16}$/;

    // Strip leading and trailing spaces.
    req.body.username = req.body.username.replace(/(^\s*)|(\s*$)/gi,"");

    // Make sure its a sane length
    if (req.body.username.length > 256)
    {
        res.redirect('/newaccount_bad_username');
        return;
    }

    // Verify email format.
    if (!regex.test(req.body.username)) {
        res.redirect('/newaccount_bad_username');
        return;
    }

    // If the passwords mismatched, redirect
    if (req.body.password != req.body.password_check) {
        req.session.newusername = req.body.username;
        res.redirect('/newaccount_password_mismatch');
        return;
    }

    // If this user exists and has been validated then protest
    getUserFromMongo(req.body.username, function(err, user) {

        // Punt if there's an error
        if(err) {
            console.log('Error with getUserFromMongo.');
            throw(err);
        }

        // If this is null, great- that's a success.  I can send an
        // authentication message to verify.
        if(undefined == user) {

            // So far so good- stow away the username away in the session 
            // while we verify that the password is valid.
            var regex = /^[a-zA-Z0-9_.]{6,64}$/

            req.session.newusername = req.body.username;

            if (!regex.test(req.body.password)) {
                res.redirect('/newaccount_bad_password');
                return;
            }

            var rand;
            var seed;
            var key;
            var userString;
            var link;

            // Generate user
            var user = {    username: req.body.username,
                password: req.body.password };

            // Generate unique number
            seed = (Date.now() - Date.UTC(2012,0,1)) * 100;
            rand = Math.floor(Math.random() * 100);
            seed += rand;

            // Prepend with a little randomness
            rand = Math.floor(Math.random() * 65536);

            // Convert the first part to hex
            prev = rand.toString(16);

            // Convert seed to hex
            hexseed = seed.toString(16);

            // Create a key
            key = "N".concat(prev).concat(hexseed);

            // Coerce the user into a string
            userString = JSON.stringify(user);

            // Add the key to the user's session.
            req.session.key = key;

            // Add this to redis
            redisClient.set(key, userString, function(err, reply){

                if(err) throw(err);

                // Give this key a timeout of 2 hours.
                redisClient.expire(key, 7200, function(){});

                var from = 'noreply@' + org;
                var subject = 'Welcome to ' + org + '!';

                // Send a validation message
                mailer.sendMail({
                    from:       from,
                    to:         req.body.username,
                    subject:    subject,
                    text:
                    'Welcome to ' + org +
                    '- the best place in the world to post photos and' +
                    'information about your meals.  Whether it\'s a homemade baloney sandwich' +
                    'or the steak and egg special at the local diner.. upload a picture- we want' +
                    'to see!  And tell us about it (if you like).\n\n' +
                    'This message will allow you to activate your account.  To do so, paste the' +
                    'following link into your favorite browser:\n\n' +

                    'http://' + webBase + '/authenticate/' + key + '\n\n' + 

                    'We look forward to seeing your lunch!\n',

                    html:       
                    '<html><head><title>' +
                    org +
                    '</title></head>' +
                    'Welcome to ' +
                    org + 
                    '- the best place in the world to post photos and' +
                    'information about your meals.  Whether it\'s a homemade baloney sandwich' +
                    'or the steak and egg special at the local diner.. upload a picture- we want' +
                    'to see!  And tell us about it (if you like).' +
                    '<br><br>' +
                    'This message will allow you to activate your account.  To do so, click' +
                    '(or copy and paste) this: <a href=\'' + webBase + '/authenticate/' + key + 
                    '\'>http://' + webBase + '/authenticate/' + key + '</a>.' +
                    '<br><br>' +
                    'We look forward to seeing your lunch!'
                }, function(err, result) {
                    req.session.tmpusername = req.body.username;
                    if(err) {
                        res.redirect('/mailerror');
                    }
                    else {
                        res.redirect('/sentmail');
                    }
                });

            });
        }
        else {
            res.redirect('/newaccount_username_taken');
        }
    });
}

// Common get function for newaccount pages
function newaccount_get(req, res, next, message) {
    var errmessage = '';
    var username = '';

    if (req.session.newusername != undefined) {
        username = req.session.newusername;
        delete req.session.newusername;
    }

    if (message != undefined) {
        errmessage = message;
    }
    res.render('newaccount.ejs', {
        errmsg: errmessage,
        username: username
    });
}

// Get functions for the newaccount pages
app.get('/newaccount_bad_password', function(req, res, next) {
    newaccount_get(req, res, next, 'Password should be between 6 and 64 letters and numbers.');
});

app.get('/newaccount_bad_username', function(req, res, next) {
    newaccount_get(req, res, next, 'Invalid email format');
});

app.get('/newaccount_password_mismatch', function(req, res, next) {
    newaccount_get(req, res, next, 'Passwords did not match');
});

app.get('/newaccount', function(req, res, next) {
    newaccount_get(req, res, next);
});

app.get('/newaccount_username_taken', function(req, res, next) {
    newaccount_get(req, res, next, 'That username is already taken!');
});

app.get('/mailerror', function(req, res, next) {
    if( debug ) {
        res.render('mailerror.ejs', {
            user: req.session.tmpusername,
            key: req.session.key
        });
    }
    else {
        res.render('mailerror.ejs', {
            user: req.session.tmpusername,
            key: ''
        });
    }
    delete req.session.tmpusername;
});

app.get('/sentreset', function(req, res, next) {

    if (debug) {
        res.render('sentreset.ejs', {
            user: req.session.tmpusername,
            key: req.session.key
        });
    }
    else {
        res.render('sentreset.ejs', {
            user: req.session.tmpusername,
            key: ''
        });
    }

    // Delete both tmpusername and key
    delete req.session.tmpusername;
    delete req.session.key;
});

app.get('/sentmail', function(req, res, next) {
    if( debug ) {
        res.render('sentmail.ejs', {
            user: req.session.tmpusername,
            key: req.session.key
        });
    }
    else {
        res.render('sentmail.ejs', {
            user: req.session.tmpusername,
            key: ''
        });
    }
    delete req.session.tmpusername;
});

// Post functions for the newacount pages.
app.post('/newaccount', newaccount_post);
app.post('/newaccount_error', newaccount_post);
app.post('/newaccount_username_taken', newaccount_post);
app.post('/newaccount_bad_username', newaccount_post);
app.post('/newaccount_bad_password', newaccount_post);
app.post('/newaccount_password_mismatch', newaccount_post);

app.get('/signout', function(req, res, next) {
    if (req.session.user != undefined) {
        delete req.session.user;
    }
    if (req.session.nextpage != undefined) {
        delete req.session.nextpage;
    }
    res.redirect('/');
});

// editmeals paging:
// If isprev is FALSE
// * Search from timestamp backwards to showpics + 1
// * if you find showpics + 1, nextpage will be that value
// * otherwise nextpage will be 0.
//
// * Search from timestamp forwards one record
// * if you find a record, prevpage will be that value
// * otherwise prevpage will be 0.
//
// If isprev is TRUE
// * Search from timestamp forwards to showpics + 1
// * If you find showpics + 1, prevpage will be that value
// * Otherwise prevpage will be 0.  Remember the number of records 
//   found
//
// * Search from timestamp backwards.
// * If the above search returned showpics records or more, search 
//   for only a single record.
// * Otherwise, search for (showpics - above) + 1 records.
// * Fill the array with the first (showpics - above) records.
// * If there is an additional record, what is your nextpage.
//

// TODO: I should always send down the maximum number of meals
var editmealsPage = function(req, res, next, timestamp, isprev, viewDeleted) {
    var ts;
    var prevpage = 0;

    if (req.session.user == undefined) {
        req.session.nextpage = '/editmeals';
        res.redirect('/signin');
        return;
    }

    if(timestamp <= 0) {
        ts = Date.now();
    }
    else {
        ts = timestamp;
    }

    /*
    if(mealDate == -1) {
        md = dateToMealDate(new Date(), MAXMEAL);
    }
    else
    {
        md = mealDate;
    }
    */
    
    if(isprev == false) {
        //getMealInfoFromMongoRev(req.session.user.username, ts, req.session.user.showMealsPerPage, viewDeleted, function(err, mealinfo, nextts, prevts) {
        getMealInfoFromMongoRev(req.session.user.userid, ts, maxMealsPerPage, viewDeleted, function(err, mealinfo, nextts, prevts) {
            // Add a hex-id to each of my mealinfos
            if(mealinfo.length == 0 && timestamp != -1) {

                ts = Date.now();

                // getMealInfoFromMongoRev(req.session.user.username,ts, req.session.user.showMealsPerPage, viewDeleted, function(err, mealinfo, nextts, prevts) {
                getMealInfoFromMongoRev(req.session.user.userid,ts, maxMealsPerPage, viewDeleted, function(err, mealinfo, nextts, prevts) {
                    res.render('editmeals.ejs', {
                        user: req.session.user,
                        mealinfo: mealinfo,
                        nextts: nextts,
                        prevts: prevts
                    });
                });
            }
            else {
                res.render('editmeals.ejs', {
                    user: req.session.user,
                    mealinfo: mealinfo,
                    nextts: nextts,
                    prevts: prevts
                });
            }
        });
    }
    else { // prevpage is true
        // getMealInfoFromMongoFwd(req.session.user.username, ts, req.session.user.showMealsPerPage, viewDeleted, function(err, mealinfo, nextts, prevts) {
        getMealInfoFromMongoFwd(req.session.user.userid, ts, maxMealsPerPage, viewDeleted, function(err, mealinfo, nextts, prevts) {
            res.render('editmeals.ejs', {
                user: req.session.user,
                mealinfo: mealinfo,
                nextts: nextts,
                prevts: prevts
            });
        }); // getMealInfoFromMongoFwd
    }
};

app.post('/editmealsuploadfail', function(req, res, next) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('Failure');
    res.end();
});

app.get('/editmeals/:timestamp', function(req, res, next) {
    editmealsPage(req, res, next, parseInt(req.params.timestamp, 10), false, false);
});

app.get('/editmeals',  function( req, res, next) {
    editmealsPage(req, res, next, -1, false, false);
});

function editmealsChangePics(req, res, next, newpics, timestamp) {

    if(req.session.user == undefined) {
        if(timestamp > 0) {
            req.session.nextpage = '/editmeals_change_pics/' + newpics + '/' + timestamp;
        } else {
            req.session.nextpage = '/editmeals_change_pics/' + newpics ;
        }
        res.redirect('/signin');
        return;
    }

    req.session.user.showMealsPerPage = newpics;
    updateShowPicsPerPageInMongo(req.session.user.username, newpics, function(err) {
        if(err) throw(err);
        editmealsPage(req, res, next, timestamp, false);
    });
}

app.get('/editmeals_change_pics/:newpics/:timestamp', function(req, res, next) {
    editmealsChangePics(req, res, next, parseInt(req.params.newpics, 10), parseInt(req.params.timestamp, 10));
});

app.get('/editmeals_change_pics/:newpics', function(req, res, next) {
    editmealsChangePics(req, res, next, parseInt(req.params.newpics, 10), -1);
});


// Allow users to upload photos.  This page might contail a clickable 
// list of their folders eventually.  First cut, it will contain some
// thumbnails of the last 10, or so, meals that they uploaded (the
// 'all' folder).  Maybe this is paged, or maybe it will look just 
// like the 'view folder' page.
//
// Done some additional thinking here.  I think there are two or three 
// separate tables per user: a table with the actual picture +/ a table 
// with the thumbnail, and a table with information.  I'm worried about
// performance.  On the one hand, having these in separate tables would
// help to preserve the database cache.  On the other hand, we'd be 
// incurring 2-3 btree hits instead of a single btree hit.
//
// I think separating the tables is the way to go- I don't want to blow
// out the cache in mongodb if I'm scanning to the n'th entry (for 
// example).  I'll explicitly accomodate the scan-case.
//
// All three tables can use the same key: username + time-uploaded.
// This will always be unique, so at most, a user can upload a meal per 
// ms.
//
// To implement a 'folder', you just need a username + folder + 
// sequence + time-uploaded.  Right now I'm thinking that it makes sense 
// to differentiate the global-folder from the others.

function edit_upload_internal_2(req, res, next, picinfo, thumbimage, iconimage) {
    var id = parseInt(req.session.user.userid);

    var mealthumb = new mealThumb(id, picinfo, thumbimage, req.files.inputupload.type);

    var mealicon = new mealIcon(id, picinfo, iconimage, req.files.inputupload.type);

    setMealThumb(mealthumb, function(mterr, object) {

        if(mterr) throw (mterr);

        // TODO: return this after setting the picture rather than the thumb
        /*
        var successResp = "SUCCESS " + picinfo.timestamp + " " + picinfo.height + " " + picinfo.thumbheight;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(successResp);
        res.end();
        */
    });

    setMealIcon(mealicon, function(mterr, object) {
        if(mterr) throw (mterr);
    });
}

var dimensions = function(width, height) {
    this.width = width;
    this.height = height;
    return this;
}

var findScaledDimensions = function(indim, outdim, maxwidth, maxheight) {

    // Both are out of range
    if(indim.width > maxwidth && indim.height > maxheight) {

        var testwidth = indim.width / maxwidth;
        var testheight = indim.height / maxheight;

        // Scale to which ever is most out of range
        if(testwidth > testheight) {
            outdim.width = maxwidth;
            outdim.height = (maxwidth / indim.width) * indim.height;
        }
        else {
            outdim.height = maxheight;
            outdim.width = (maxheight / indim.height) * indim.width;
        }
    }
    // Width is out of range: scale to width
    else if(indim.width > maxwidth) {
        outdim.width = maxwidth;
        outdim.height = (maxwidth / indim.width) * indim.height;
    }
    // Height is out of range: scale to height
    else if(indim.height > maxheight){
        outdim.height = maxheight;
        outdim.width = (maxheight / indim.height) * indim.width;
    }
    // Both height and width are in range
    else {
        outdim.height = indim.height;
        outdim.width = indim.width;
    }
    // We want the floor
    outdim.height = Math.floor(outdim.height);
    outdim.width = Math.floor(outdim.width);
}


// TODO: write a scaling function would clean this up quite a bit
function edit_upload_internal_1(req, res, next, image, mealinfo, picinfo) {

    // Scale to thumbnail dimensions
    var scaleThumbWidth;
    var scaleThumbHeight;

    var scaleIconWidth;
    var scaleIconHeight;

    var outdimthumb = new dimensions( 0, 0 );
    var outdimicon = new dimensions( 0, 0 );

    // Find scaled dimensions for thumb and icon
    findScaledDimensions(picinfo, outdimthumb, maxThumbWidth, maxThumbHeight);
    findScaledDimensions(picinfo, outdimicon, maxIconWidth, maxIconHeight);

    // Set the thumb dimensions
    picinfo.thumbwidth = scaleThumbWidth = outdimthumb.width;
    picinfo.thumbheight = scaleThumbHeight = outdimthumb.height;

    // Set the icon dimensions before adding the picinfo to mongo
    picinfo.iconwidth = scaleIconWidth = outdimicon.width;
    picinfo.iconheight = scaleIconHeight = outdimicon.height;

    // Set the image type
    picinfo.imagetype = req.files.inputupload.type;

    // Increment the number of pictures this user has
    req.session.user.numPics++;

    updateCurrentNumPicsInMongo(req.session.user.username, req.session.user.numPics, function(err) { 
        if(err) throw(err);
    });

    // Write the picture to disk (and maybe to redis).  
    // Instead of setMealPicInMongo, just write the picture

    // XXX
    var mealpic = new mealRecord(parseInt(req.session.user.userid), picinfo, req.files.inputupload.type);

    // Write this record
    setMealRecordInMongo(mealpic, function(err, object) {

        if(err) throw(err);

        // Set the image
        mealpic.image = image;

        // Write to redis & fs 
        setMealPic(mealpic, function(err, object) {

            // Push the new picture onto the mealinfo's picinfo array
            mealinfo.picInfo.push(picinfo);

            // Update the picinfo array in the mealInfo object
            updateMealInfoPicInfoInMongo(mealinfo, function(merror, object) {

                if(merror) throw(merror);

                var successResp = "SUCCESS " + picinfo.timestamp + " " + picinfo.height + 
                        " " + picinfo.thumbheight + " " + picinfo.thumbwidth;
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(successResp);
                res.end();

                // Have to resize either both, only the icon, or neither
                var resizeIcon = ( picinfo.width > maxIconWidth || picinfo.height >= maxIconHeight );
                var resizeThumb = ( picinfo.width > maxThumbWidth || picinfo.height >= maxThumbHeight );
    
                var target = resizeIcon + resizeThumb;
                var count = 0;
    
                if(0 == target) {
                    edit_upload_internal_2( req, res, next, picinfo, image, image );
                    return;
                }
    
                var thumbimage = (resizeThumb == 0 ? image : null );
                var iconimage = (resizeIcon == 0 ? image : null );
    
                function callback(thumb, icon) {
    
                    if(thumb) thumbimage = thumb;
                    if(icon) iconimage = icon;
    
                    if(++count >= target) {
                        edit_upload_internal_2( req, res, next, picinfo, thumbimage, iconimage );
                    }
                }
    
                // The thumbnail is last.  An earlier version used to return control to the 
                // user here.  This was to do the thumbnail creation-processing out-of-band:
                // If the user requests the thumbnail and it hasn't made it to mongo, I can 
                // always send the full picture.
                if(resizeThumb) {
                    im.resize( { 
                        srcData: image,
                        width: scaleThumbWidth,
                        height: scaleThumbHeight
                    }, // The resized image is stdout.
                    function(err, thumb, stderr) {
                        if(err) throw (err);
                        callback(thumb, null);
                        return;
                    });
                }
    
                if(resizeIcon) {
                    im.resize( { 
                        srcData: image,
                        width: scaleIconWidth,
                        height: scaleIconHeight
                    }, // The resized image is stdout.
                    function(err, icon, stderr) {
                        if(err) throw (err);
                        callback(null, icon);
                        return;
                    });
                }
            }, 0);
        });
    });
}

function imageFeatures(path, callback) {
    var features = {}; 
    // TODO - break and join this so that its readable
    var format='Type|%m\nWidth|%[width]\nHeight|%[height]\nDepth|%[depth]\nDatetime|%[EXIF:DateTime]\nCreateDate|%[EXIF:DateTimeOriginal]\nLat|%[EXIF:GPSLatitude]\nLong|%[EXIF:GPSLongitude]\nDirection|%[EXIF:GPSImgDirection]\nLatRef|%[EXIF:GPSLatitudeRef]\nLongRef|%[EXIF:GPSLongitudeRef]\n';
        im.identify(['-format', format, path ], function(error, out) {

        if(error) {
            callback(error);
        }

        // Parse features. 
        var lines = out.toString().split(/\n/);
        for(var i = 0 ; i < lines.length ; i++) {
            var line = lines[i].trim();
            var array = line.split(/\|/);
            if(array[0] == 'Width' && array[1] != undefined && array[1].length > 0) {
                features.width = parseInt(array[1], 10);
            }
            else if(array[0] == 'Height' && array[1] != undefined && array[1].length > 0) {
                features.height = parseInt(array[1], 10);
            }
            else if(array[0] == 'Depth' && array[1] != undefined && array[1].length > 0) {
                features.depth = parseInt(array[1], 10);
            }
            else if(array[0] == 'Type' && array[1] != undefined && array[1].length > 0) {
                features.type = array[1];
            }
            else if(array[0] == 'Datetime' && array[1] != undefined && array[1].length > 0) {
                var dayTime = array[1].split(/ /);
                var dayComp = dayTime[0].split(/:/);
                var timeComp = dayTime[1].split(/:/);

                var year = parseInt(dayComp[0], 10);
                var month = parseInt(dayComp[1], 10);
                var day = parseInt(dayComp[2], 10);
                var hour = parseInt(timeComp[0], 10);
                var min = parseInt(timeComp[1], 10);
                var sec = parseInt(timeComp[2], 10);

                features.datetime = new Date(year, month, day, hour, min, sec);
            }
            else if(array[0] == 'CreateDate' && array[1] != undefined && array[1].length > 0) {
                var dayTime = array[1].split(/ /);
                var dayComp = dayTime[0].split(/:/);
                var timeComp = dayTime[1].split(/:/);

                var year = parseInt(dayComp[0], 10);
                var month = parseInt(dayComp[1], 10);
                var day = parseInt(dayComp[2], 10);
                var hour = parseInt(timeComp[0], 10);
                var min = parseInt(timeComp[1], 10);
                var sec = parseInt(timeComp[2], 10);

                features.createDate = new Date(year, month, day, hour, min, sec);
            }
            else if(array[0] == 'Lat' && array[1] != undefined && array[1].length > 0) {
                // The format is 'DEGREES/1, MINUTES/100, SECONDS/?'
                var components = array[1].split(/, /);
                var degrees = components[0].split(/\//);
                var minutes = components[1].split(/\//);
                var seconds = components[2].split(/\//);
                features.latitude = ( parseInt(degrees[0], 10) ) + 
                                    ( ( parseInt(minutes[0], 10) / 60 ) / 100 ) +
                                    ( ( parseInt(seconds[0], 10) / ( 60 * 60 ) ) / 10000 );
            }
            else if(array[0] == 'Long' && array[1] != undefined && array[1].length > 0) {
                var components = array[1].split(/, /);
                var degrees = components[0].split(/\//);
                var minutes = components[1].split(/\//);
                var seconds = components[2].split(/\//);
                features.longitude= ( parseInt(degrees[0], 10) ) + 
                                    ( ( parseInt(minutes[0], 10) / 60 ) / 100 ) +
                                    ( ( parseInt(seconds[0], 10) / ( 60 * 60 ) ) / 10000 );

            }
            else if(array[0] == 'Direction' && array[1] != undefined && array[1].length > 0) {
                var components = array[1].split(/\//);
                features.direction = ( parseInt(components[0], 10) / parseInt(components[1], 10) );
            }
            else if(array[0] == 'LatRef' && array[1] != undefined && array[1].length > 0) {
                features.latitudeRef = array[1];
            }
            else if(array[0] == 'LongRef' && array[1] != undefined && array[1].length > 0) {
                features.longitudeRef = array[1];
            }
        }

        if( features.latitudeRef == 'S' && features.latitude > 0) {
            features.latitude = -features.latitude;
        }

        if( features.longitudeRef == 'W' && features.longitude > 0) {
            features.longitude = -features.longitude;
        }

        callback(null, features);
    });
}

function imagepath( userid, mealts, picts ) 
{
    return basedirectory + '/' + userid + '/images/' + mealts + '/' + picts;
}

function thumbpath( userid, mealts, picts )
{
    return basedirectory + '/' + userid + '/thumbs/' + mealts + '/' + picts;
}

// Massage a mealpic that the user has just uploaded
// Refactor this: I want a resized meal, thumb, and icon.
function editMealsUploadPost(req, res, mealinfo, next) {

    imageFeatures(req.files.inputupload.path, function(err, features) {

        if(err) {
            console.log("Error identifying uploaded file: " + req.files.inputupload.path);
            req.session.uploadmsg = "Error uploading your file!";

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(req.session.uploadmsg);
            res.end();

            return;
        }

        // Ideal case: there's no resizing to do.  just move the picture in place
        if(features.width <= maxMealWidth && features.height <= maxMealHeight) {
            fs.readFile(req.files.inputupload.path, "binary", function(error, image) {
                var picinfo = new picInfo(
                    mealinfo.timestamp,
                    req.files.inputupload.name, 
                    req.files.inputupload.size, 
                    features.width,
                    features.height,
                    req.files.inputupload.type,
                    features);

                edit_upload_internal_1(req, res, next, image, mealinfo, picinfo);
            });
            return;
        }

        var scaleWidth;
        var scaleHeight;

        var outdim = new dimensions(0, 0);

        findScaledDimensions(features, outdim, maxMealWidth, maxMealHeight);

        scaleWidth = outdim.width;
        scaleHeight = outdim.height;

        // Okay - resize this and then upload
        im.resize( { 
            srcPath: req.files.inputupload.path,
            width: scaleWidth, 
            height: scaleHeight
        }, // The resized image is stdout.
        function(err, stdout, stderr) {
            // There will be a new size here ..
            // XXX picinfo not mealinfo
                var picinfo = new picInfo(
                    mealinfo.timestamp,
                    req.files.inputupload.name, 
                    stdout.length,
                    scaleWidth,
                    scaleHeight,
                    req.files.inputupload.type,
                    features);

                edit_upload_internal_1(req, res, next, stdout, mealinfo, picinfo);
        });

        return;
    });
}

app.post('/savemealdate', function(req, res, next) {

    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write("BAD-REQUEST");
        res.end();
        return;
    }
    if(req.body.username == undefined) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write("BAD-REQUEST");
        res.end();
        return;
    }
    if(req.body.username != req.session.user.username) {
        console.log('mismatched usernames in savemealdate request:');
        console.log('session user is ' + req.session.user.username);
        console.log('request user is ' + req.body.username);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write("BAD-REQUEST");
        res.end();
        return;
    }

    if(req.body.timestamp == undefined) {
        console.log('no timestamp in savemealdate request:');
        console.log('session user is ' + req.session.user.username);
        console.log('request user is ' + req.body.username);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write("BAD-REQUEST");
        res.end();
        return;
    }

    if(req.body.mealdate == undefined) {
        console.log('no mealdate in savemealdate request:');
        console.log('session user is ' + req.session.user.username);
        console.log('request user is ' + req.body.username);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write("BAD-REQUEST");
        res.end();
        return;
    }

    // Everything is scrubbed: update the mealdate in mongo
    updateMealDateInMongo(req.session.user.username, parseInt(req.body.timestamp, 10),
            parseInt(req.body.mealdate,10), function(err) {
                if(err) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write("DB-ERROR");
                    res.end();
                    return;
                }
                else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write("SUCCESS");
                    res.end();
                    return;
                }
            }
    );

});


app.post('/editmealsupload', function(req, res, next) {

    var userid = parseInt(req.body.username, 10);

    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write("BAD-REQUEST");
        res.end();
        return;
    }

    if(req.body.username == undefined) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write("BAD-REQUEST");
        res.end();
        return;
    }
    if(userid != req.session.user.userid) {
        console.log('mismatched usernames in editmealsupload request:');
        console.log('session user is ' + req.session.user.userid);
        console.log('request user is ' + userid);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write("BAD-REQUEST");
        res.end();
        return;
    }

    // Make sure that there's a mealinfo timestamp, and that i can find it
    if(!req.body.mealInfo) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write("BAD-REQUEST");
        res.end();
        return;
    }

    // Check if this user has exceeded the maximum number of pictures
    if(req.session.user.maxPics > 0 && req.session.user.numPics >= 
            req.session.user.maxPics) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write("HAVE MAXIMUM PICS FOR THIS USER " + req.session.user.maxPics);
        res.end();
        return;
    }

    getOneMealInfoFromMongo(parseInt(req.body.username), parseInt(req.body.mealInfo, 10), function(err, mealInfo) {
        if(err) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write("BAD-REQUEST");
            res.end();
            return;
        }

        var maxpics = defaultMaxPicsPerMeal;

        if(req.session.user.maxPicsPerMeal) {
            maxpics = req.session.user.maxPicsPerMeal;
        }

        // Verify that we're allowed to upload another picture
        // This should be part of the user attributes, not the meal's attributes
        if(maxpics > 0 && 
            mealInfo.picInfo.length >= maxpics) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write("HAVE MAXIMUM PICS FOR THIS MEAL " + maxpics);
            res.end();
            return;
        }

        editMealsUploadPost(req, res, mealInfo, next);
    });
});

app.get('/newmeal', function(req, res, next) {

    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "baduser"}));
        res.end();
        return;
    }
    if(req.query.username == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "badrequest"}));
        res.end();
        return;
    }

    var userid = parseInt(req.query.username);

    if(userid != req.session.user.userid) {
        console.log('mismatched userids in newmeal request:');
        console.log('session userid is ' + req.session.user.userid);
        console.log('request userid is ' + req.body.username);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "baduser"}));
        res.end();
        return;
    }

    var mealinfo = new mealInfo(req.session.user);

    setMealInfoInMongo(mealinfo, function(err, object) {
        if(err) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({message: "internal-error"}));
            res.end();
            return;
        }

        // Write this mealinfo to mongo.
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify( { message: "success", timestamp: mealinfo.timestamp }));
        res.end();
        return;
    });
});

function accountEditGetUser(req, res, next, targetUser) {
    res.render('accountedit.ejs', {
        editUser: req.session.user,
        user: targetUser,
        errmsg: ""
    });
}

function accountEditPostTarget(req, res, next, targetUser) {
    getUserFromMongo(targetUser.username, function(err, foundUser) {
        if(err) throw (err);
        if(foundUser == undefined) {
            console.log('Attempt to modify information for a non-existant user?');
            console.log('Username: ' + targetUser.username);
            console.log('Modifying User: ' + req.session.user.username);
            res.redirect('/');
            return;
        }
        overlayUserInfo(req, foundUser);
        updateCompleteUserInfoInMongo(foundUser, function(err) {
            if(err) throw(err);

            if(foundUser.username == req.session.user.username) {
                req.session.user = foundUser;
            }
            res.render('accountedit.ejs', {
                editUser: req.session.user,
                user: foundUser,
                errmsg: "Updated User Information"
            });
        });
    });
}

function accountEditPost(req, res, next, targetUsername) {
    if(targetUsername != req.session.user.username && req.session.user.isAdmin == false) {
        res.redirect('/');
        return;
    }

    getUserFromMongo(targetUsername, function(err, user) {
        if(undefined == user) {
            // Log this attempt
            console.log('Attempt to modify information for a non-existant user?');
            console.log('Username: ' + targetUsername);
            console.log('Modifying User: ' + req.session.user.username);
            res.redirect('/');
            return;
        }

        accountEditPostTarget(req, res, next, user);
        return;
    });
}

function accountEditGet(req, res, next, username) {
    var targetUser;
    if(username == req.session.user.username) {
        targetUser = req.session.user;
        accountEditGetUser(req, res, next, targetUser);
        return;
    }
    else if(req.session.user.isAdmin != true) {
        res.redirect('/');
        return;
    } 
    else {
        getUserFromMongo(username, function(err, foundUser) {
            if(err) throw(err);
            if(undefined == foundUser) {
                console.log('Attempt to modify information for a non-existant user?');
                console.log('Username: ' + username);
                console.log('Modifying User: ' + req.session.user.username);
                res.redirect('/');
                return;
            }
            accountEditGetUser(req, res, next, foundUser);
            return;
        });
    }
}

app.get('/account/:username', function(req, res, next) {
    if(req.session.user == undefined) {
        req.session.nextpage = '/account/' + req.params.username;
        res.redirect('/signin');
        return;
    }

    accountEditGet(req, res, next, req.params.username);
});

// Allow a user to edit their account information.
app.get('/account', function(req, res, next) {
    if(req.session.user == undefined) {
        req.session.nextpage = '/account';
        res.redirect('/signin');
        return;
    }

    accountEditGet(req, res, next, req.session.user.username);
});

app.post('/account/:username', function(req, res, next) {
    if(req.session.user == undefined) {
        req.session.nextpage = '/account';
        res.redirect('/signin');
        return;
    }

    accountEditPost(req, res, next, req.params.username);
});

app.post('/account', function(req, res, next) {
    if(req.session.user == undefined) {
        req.session.nextpage = '/account';
        res.redirect('/signin');
        return;
    }
    accountEditPost(req, res, next, req.session.user.username);
});

app.get('/restaurantinfo/:restaurantId', function(req, res, next) {
    var restaurantId = parseInt(req.params.restaurantId, 10);
    var user;

    if(req.session.user != undefined) {
        user=req.session.user;
    }
    else {
        user.username = "";
    }

    getRestaurantInfoById( restaurantId, function(err, restaurantInfo) { 
        if(err) throw (err);
        if(undefined == restaurantInfo) {
            console.log('request for non-existant restaurant:' + restaurantId );
            res.redirect('/');
            return;
        }
        res.render('restaurantinfo.ejs', {
            user: user,
            restaurant: restaurantInfo
        });
        return;
    });
});

// If this person is an admin continue - if not, we'll redirect
function verifyAdmin(req, res, next) {

    if(req.session.user == undefined) {
        req.session.nextpage = '/yesreallyanadmin';
        res.redirect('/signin');
        return 0;
    }
    if(req.session.user.isAdmin == false) {
        // This page purposely does not exist
        res.redirect('admin');
        return 0;
    }

    return 1;
}

// Page for an administrator to modify a userrecord
app.get('/admin_modify_user', function(req, res, next) {

    if(!verifyAdmin(req,res,next)) {
        return;
    }
});

// Page for an administrator to set the rotating mealpics
app.get('/admin_set_rotating', function(req, res, next) {

    if(!verifyAdmin(req,res,next)) {
        return;
    }
});


// This user is an admin
app.get('/yesreallyanadmin', function(req, res, next) {

    if(!verifyAdmin(req,res,next)) {
        return;
    }

    // Verify admin options
    res.render('admin.ejs', {
        user: req.session.user
    });

});

// Get the user picture & thumbs base directory
if(process.env.MYLUNCH_USER_BASE_IMAGES) {
    basedirectory = process.env.MYLUNCH_USER_BASE_IMAGES;
}
else {
}

if(process.env.MYLUNCH_LOGNAME) {
    logfilename = process.env.MYLUNCH_LOGNAME;
}

// Roll the logfile
var maxback = 7;

// How many logfiles to keep
if(process.env.MYLUNCH_KEEP_LOG_COUNT) {
    maxback = process.env.MYLUNCH_KEEP_LOG_COUNT;
    if(maxback < 1) maxback = 1;
}

// Use fs.renameSync(old, new);
for(var ii = maxback ; ii > 0 ; ii--) {
    var oldname, newname;

    if(ii == 1) {
        oldname = logfilename;
    }
    else {
        oldname = logfilename + '.' + (ii - 1);
    }

    newname = logfilename + '.' + ii;

    // Ignore any errors
    try {
        fs.renameSync(oldname, newname);
    }
    catch(err) { 
        // console.log("mv " + oldname + " " + newname + " error: " + err);
    }
}

// Open the logfile
log = fs.createWriteStream(logfilename, { 'flags': 'a' });

// Show pictures and information about the meals that I've uploaded.
// I will allow each user to generate their own 'category' or 'folder',
// but any category will simply contain references to the photos table.
// In fact, the 'all' folder might do that as well - the advantage of 
// this is that I never have to actually delete anything.  If someone 
// deletes from the 'all' folder, I just have to remove the reference
// to that photo from each of their views.  Maybe I could even have a
// trashcan of photos.  Maybe I'll figure that out.
//
// Reordering within a folder: maybe I could list 'screen-coordinates'
// with the photo, and use that to place it on the page?  If it's just
// and incrementing integer, I would only have to support an 'append' 
// operation, a 'delete' operation, and a 'switch' operation.  Delete
// could simply leave a hole.  Switch would update two records.
// Append would append a single record.
// 
// Opens a window with all of the pictures in it.  Maybe there's some
// javascript on the client that allows you to 'click' into it to see
// exteneded information (i.e., title, when taken, where taken, what 
// restaurant, phone-number, link-to-webside, what type of food it is, 
// long description, whether this is a public-meal (allowed to be 
// viewed externally), how delicious was it, etc).
//
// It also might be fun (and campy) to allow users to create slide-
// shows of their lunches, and to send these slideshows to their 
// friends and family.  :)
//
// NO - this is important - this project will be defined as much by 
// the dumb things which don't get in as by the interesting things 
// which do get in.

// Open everything that we need to open
//
// Play with the cluster node.js module
var use_cluster = 0;

if(use_cluster) {

    var cluster = require('cluster');
    var numcpus = require('os').cpus().length;
    var workers = (numcpus < 4) ? 4 : numcpus;

    if(cluster.isMaster) {
        for(var i = 0; i < workers; i++) {
            cluster.fork();
        }

        cluster.on('exit', function(worker, code, signal) {
            wrlog(log, 'Worker ' + worker.process.pid + ' has died', true);
        });


    } else {
        app.listen(webPort, function(){
            wrlog(log, org + ' pid ' + process.pid + ' started on port ' + webPort, true);
        });
    }
}
else {
    app.listen(webPort, function(){
        wrlog(log, org + ' pid ' + process.pid + ' started on port ' + webPort, true);
    });
}
