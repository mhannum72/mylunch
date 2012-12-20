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

// Enable debugging
var debug = 1;

// Constant
var msPerSecond = 1000;

// Boilerplate modules
var express = require('express');
var fs = require('fs');
var util = require('util');
var geoip = require('geoip');
var city = new geoip.City('geolitecity/GeoLiteCity.dat');

// forget zlib (its slow).  if im gonna compress i'll use lz4
// var zlib = require('zlib');

// Image manipulation 
var im = require('imagemagick');

// Maximum pictures per meal (alot for a single meal).
var defaultMaxPicsPerMeal = 64; 
// Scale variables
var maxMealWidth = 780;
var maxMealHeight = 780;
var maxThumbWidth = 300;
var maxThumbHeight = 300;

// Maximum poll time waiting for deletes
var maxDeletePollTime = 1 * msPerSecond;

// Throttle updates to tmpReviews
var tmpReviewUpdateMs = 10 * msPerSecond;

// info can only be updated once every second
var infoUpdateMs = 1 * msPerSecond;

// position can only be updated once every 10 seconds
var posUpdateMs = 5 * msPerSecond;

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

// Tried async thumbs: it's more efficient to go inline.  
// TODO: Find or write a faster image-resizer.
var org = 'mylunch.org';

// Mongo handle
var mongo = require('mongodb'),
    db = new mongo.Db('mylunch', new mongo.Server('localhost', 27017, { auto_reconnect: true }));

// Open Mongo
db.open(function(error, client){
    if (error) throw error;
    
    // Create indexes for users
    db.collection('users', function(error, collection) {
        collection.ensureIndex({username:1},{unique:true});
    });

    // Create indexes for mealInfo
    db.collection('mealInfo', function(error, collection) {
        collection.ensureIndex({username:1, timestamp:1},{unique:true});
        collection.ensureIndex({timestamp:1, worldViewable: 1, verifiedByAdmin:1, adminAllow:1});
        collection.ensureIndex({restaurantId: 1});
        collection.ensureIndex({username: 1, deleted: 1, whenDeleted: 1});
        collection.ensureIndex({username: 1, mealDate:1, timestamp:1},{unique:true});
    });

    // Create indexes for picInfo - dead code i think
    /*
    db.collection('picInfo', function(error, collection) {
        collection.ensureIndex({username:1, timestamp:1}, {unique:true});
        collection.ensureIndex({username:1, mitimestamp:1});
    });
    */

    // Create indexes for mealPics
    db.collection('mealPics', function(error, collection) {
        collection.ensureIndex({username:1, timestamp:1},{unique:true});
    });

    // Create indexes for mealThumbs
    db.collection('mealThumbs', function(error, collection) {
        collection.ensureIndex({username:1, timestamp:1},{unique:true});
    });

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


// This might change:  an 'image-of-the-day' might make more sense
getRotatingImagesFromMongo = function(callback) {
    getCollection('rotating_images', function(error, rotTable) {
        if(error) throw (error);
        rotTable.find({ deleted: false }).toArray(function(err, results) {
            if(err) throw(err);
            callback(err, results);
        });
    });
}

// Insert a new user into mongodb
setNewUserInMongo = function(user, callback) {
    getCollection('users', function(error, userTable) {
        if(error) throw (error);
        if(user.username == undefined) {
            throw new Error('setNewUserInMongo called with NULL username.');
        }
        userTable.insert(user, {safe:true}, function(err, object) {
            if(err) throw (err);
            callback(err, object);
        });
    });
}

// Set the last login to now.
updateLastLoginInMongo = function(username, callback) {
    getCollection('users', function(error, userTable) {

        if(error) throw (error);
        var lastLogin = Date.now();
        userTable.update({username: username}, {$set: {lastLogin: lastLogin}}, {safe:true}, function(err) {
            if(err) throw(err);
            callback(err);
        });
    });
}

// Update the user's current disk usage & number of pictures
updateCurrentNumPicsInMongo = function(username, numPics, callback) {
    getCollection('users', function(error, userTable) {

        if(error) throw (error);
        userTable.update({username: username}, {$set: {numPics:numPics}}, {safe:true}, function(err) {
            if(err) throw(err);
            callback(err);
        });
    });
}

updateShowPicsPerPageInMongo = function(username, showMealsPerPage, callback) {
    getCollection('users', function(error, userTable) {

        if(error) throw (error);
        userTable.update({username: username}, {$set: {showMealsPerPage:showMealsPerPage}}, {safe:true}, function(err) {
            if(err) throw(err);
            callback(err);
        });
    });
}

updateTitleInMongo = function(username, timestamp, title, callback) {
    getCollection('mealInfo', function(error, mealinfo) {
        if(error) throw(error);
        mealinfo.update({username: username, timestamp: timestamp}, {$set: {title: title}}, {safe: true}, function(err) {
            if(err) throw(err);
            callback(err);
        });
    });
}

updateRatingInMongo = function(username, timestamp, rating, callback) {
    getCollection('mealInfo', function(error, mealinfo) {
        if(error) throw(error);
        mealinfo.update({username: username, timestamp: timestamp}, {$set: {rating: rating}}, {safe: true}, function(err) {
            if(err) throw(err);
            callback(err);
        });
    });
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
    throw new Error("Invalid mealConst: " + meal);
}

updateMealInMongo = function(username, timestamp, meal, callback) {
    getCollection('mealInfo', function(error, mealinfo) {
        if(error) throw(error);

        // Have to find it- this will pull it into the buffer cache
        mealinfo.find( { username: username, timestamp: timestamp } ).toArray( function(err, results) {
            if(err) throw(err);
            if(results.length > 1) {
                throw new Error(results.length + ' mealInfo records in mongo for ' + username + ' timestamp ' + timestamp);
            }

            var oldDate = results[0].mealDate;
            var newMealDate = (oldDate - (oldDate % 100)) + mealToConst(meal);

            mealinfo.update({username: username, timestamp: timestamp}, 
                    {$set: {meal: meal, mealDate: newMealDate}}, {safe: true}, function(err) {
                if(err) throw(err);
                callback(err);
            });
        });
    });
}

updateReviewInMongo = function(username, timestamp, review, callback) {
    getCollection('mealInfo', function(error, mealinfo) {
        if(error) throw(error);
        mealinfo.update({username: username, timestamp: timestamp}, {$set: {review: review}}, {safe: true}, function(err) {
            if(err) throw(err);
            callback(err);
        });
    });
}

updateTmpReviewInMongo = function(username, timestamp, tmpreview, callback) {
    getCollection('mealInfo', function(error, mealinfo) {
        if(error) throw(error);
        mealinfo.update({username: username, timestamp: timestamp}, {$set: {tmpReview: tmpreview}}, {safe: true}, function(err) {
            if(err) throw(err);
            callback(err);
        });
    });
}

// Update the user's mealinfo information
updateCompleteMealInfoInMongo = function(mealinfo, callback) {
    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);

        mealInfo.update({username:mealinfo.username, timestamp:mealinfo.timestamp}, mealinfo, {safe:true}, function(err) {
            if(err) throw(err);
            callback(err);
        });
    });
}


// Update a user's password
updatePasswordInMongo = function(username, newpassword, callback) {
    getCollection('users', function(error, userTable) {
        if(error) throw (error);
        userTable.update({username: username}, {$set: {password: newpassword}}, {safe:true}, function(err) {
            if(err) throw(err);
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
getOneMealInfoFromMongo = function(username, timestamp, callback) {
    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);
        
        mealInfo.find(  {username: username, timestamp: timestamp, deleted: false } )
        .toArray( function(err, results) {
            if(err) throw(err);
            if(results.length > 1) {
                throw new Error(results.length + ' mealInfo records in mongo for ' + username + ' timestamp ' + timestamp);
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

// To delete, I just set the deleted flag - later I have a task which deletes the older deletes nightly
// (maybe there will be a waste-bin where I can undelete meals..)
setDeleteFlagInMongo = function(username, timestamp, callback) {
    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);
        var deletedTime = Date.now();
            mealInfo.findAndModify({username:username, timestamp:timestamp, deleted:false}, [], {$set: {deleted:true, whenDeleted: deletedTime}},{new:true}, function(err, record) {
            if(err) throw(err);

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

// TODO - restaurant page
// redo the meal edit page.  Make every change an ajax .json request
// Will this be too chaty?
//
// I'd like user's to be able to PUBLISH reviews to the restaurant page.
// Maybe a pop-up will tell the user that they can't modify their mealinfo
// after a review has been published to the restaurant page..   
// YES - this restricts freedom a bit, but we have to have SOME rules.
//
// Maybe I should have two buttons: a 'SAVE CHANGES' button, and a
// 'PUBLISH TO RESTAURANT PAGE' button.  I will introduce a 'mealInfo state'
// You are either 'unpublished', 'under review', 'published', and maybe 'barred'
// I will have to consider this more..
//
// I'm not sure if I will have the 'under-review' part .. I can allow it,
//
// XXX prolly dead code

updateVerifyMealInfoInMongo = function(mealinfo, callback) {
    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);

        mealInfo.update({username:mealinfo.username, timestamp:mealinfo.timestamp}, {$set: {verifiedByAdmin: mealinfo.verifiedByAdmin, adminAllow: mealinfo.adminAllow}}, {safe:true}, function(err) {
            if(err) throw(err);
            callback(err);
        });
    });
}

// Get mealinfo information.  Call this the first time with afterTs set
// to 0, and always pass in the timestamp of the last record.
getMealInfoFromMongoFwd_int = function(username, md, ts, limit, viewDeleted, wholerec, callback) {
    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);

        var projection = {};
        if(!wholerec) {
            projection = { 'username' : 1, 'mealDate': 1, 'timestamp' : 1, 'meal' : 1, 'picInfo' : 1 };
        }

        // Make sure to sort in the direction of your search to get sane results.
        mealInfo.find(

            // Query
            {       $or :     [         { $and :    [   { username: username },
                                                        { mealDate: md },
                                                        { timestamp: { $gte: ts } },
                                                        { deleted: viewDeleted } ] },
                                        { $and :    [   { username: username },
                                                        { mealDate: { $gt: md } },
                                                        { deleted: viewDeleted } ] } ] },

            // Index
            // { $hint : { username: 1, mealDate: 1, timestamp: 1 } },

            // Columns
            projection )

            // Order
            .sort( { mealDate : 1,  timestamp : 1 } )

            // Limit
            .limit( limit + 1 )

            // Array
            .toArray( function ( err, results ) {

            if(err) 
            {
                console.log("Error 1");
                throw(err);
            }

            var prevtimestamp = 0;
            var prevmealdate = 0;

            var prevpage=0;
            var newlimit=0;

            // Reverse these results
            results.reverse();
            
            if( results.length > limit ) {
                prevmealdate = results[0].mealDate;
                prevtimestamp = results[0].timestamp;
                results = results.slice(1, limit + 1);

                // Search only a single record in the other direction for a nextpage.
                newlimit = 0;
            }
            else {
                newlimit = (limit - results.length);
            }

//            mealInfo.find( {username: username, timestamp: { $lt: ts }, deleted: viewDeleted } )
//            .sort( { timestamp: -1 } ) .limit( newlimit + 1).toArray( function(err, results2) {
            mealInfo.find(

                // Query
                {   $or :       [       { $and :    [       { username: username },
                                                            { mealDate: md },
                                                            { timestamp: { $lt: ts } },
                                                            { deleted: viewDeleted } ] },
                                        { $and :    [       { username: username },
                                                            { mealDate: { $lt: md } },
                                                            { deleted: viewDeleted } ] } ] },

                // Index
                // { $hint : { username: 1, mealDate: 1, timestamp: 1 } },

                // Columns
                projection )

                // Sort
                .sort( { mealDate : 1,  timestamp : 1 } )

                // Limit
                .limit( newlimit + 1 )

                // Array
                .toArray( function( err, results2 ) {

                    if(err) 
                    {
                        console.log("Error 1");
                        throw(err);
                    }

                    var nextmealdate = 0;
                    var nextmealtimestamp = 0;

                    if( results2.length > newlimit ) {
                        nextmealdate = results2[newlimit].mealDate;
                        nexttimestamp = results2[newlimit].timestamp;
                        results2 = results2.slice(0, newlimit);
                    }
                    callback(err, results.concat(results2), 
                        nextmealdate, nextmealtimestamp, prevmealdate, prevmealtimestamp);
            });
        });
    });
}

getMealInfoFromMongoFwd = function(username, md, ts, limit, viewDeleted, callback) {
    getMealInfoFromMongoFwd_int(username, md, ts, limit, viewDeleted, true, callback);
}

getMealInfoFromMongoFwdMenu = function(username, md, ts, limit, viewDeleted, callback) {
    getMealInfoFromMongoFwd_int(username, md, ts, limit, viewDeleted, false, callback);
}

// This is the 'next' case.
getMealInfoFromMongoRev_int = function(username, md, ts, limit, viewDeleted, wholerec, callback) {
    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);

        var projection = {};
        var cnt = 0;

        if(!wholerec) {
            projection = { 'username' : 1, 'mealDate': 1, 'timestamp' : 1, 'meal' : 1, 'picInfo' : 1 };
        }
        
        // This is convoluted query finds mealinfo records before mealDate, timestamp.
        mealInfo.find( 

            // Query
            {   $or :   [               { $and :    [   { username: username }, 
                                                        { mealDate: md }, 
                                                        { timestamp: { $lte: ts } }, 
                                                        { deleted: viewDeleted } ] },
                                        { $and :    [   { username: username }, 
                                                        { mealDate: { $lt: md } }, 
                                                        { deleted: viewDeleted } ] } ] },

            // Index
            //{ $hint : {    username: 1, mealDate: 1, timestamp: 1 } }, 

            // Columns
            projection )

            // Sort
            .sort( { mealDate : -1, timestamp: -1})

            // Limit
            .limit(limit + 1)

            // Results
            .toArray( function(err, results) {

            var nexttimestamp=0;
            var nextmealdate=0;

            // Throw an error for now
            if(err) 
            {
                console.log("Error 3");
                throw(err);
            }

            // Fill nextmealdate and timestamp
            if( results.length > limit ) {

                nextmealdate = results[limit].mealDate;
                nexttimestamp=results[limit].timestamp;
                results = results.slice(0, limit);

            }

            // Search one record in the other direction
            mealInfo.find( 

            // Query
            {       $or :       [           { $and :    [   { username: username }, 
                                                            { mealDate: md }, 
                                                            { timestamp: { $gt: ts } }, 
                                                            { deleted: viewDeleted } ] },
                                            { $and :    [   { username: username }, 
                                                            { mealDate: { $gt: md } }, 
                                                            { deleted: viewDeleted } ] } ] }, 
                                                        
            // Index
            //{ $hint :   { username: 1, mealDate: 1, timestamp: 1 } },

            // Columns
            projection )

            // Sort
            .sort( { mealDate : 1, timestamp: 1})

            // Limit
            .limit(1)

            // Results
            .toArray(function(err, presults) {

                var prevtimestamp=0;
                var prevmealdate=0;

                // Throw an error for now
                if(err) 
                {
                    console.log("Error 4");
                    throw(err);
                }

                // Fill previous mealDate and timestamp variables
                if(presults.length > 0) {

                    prevmealdate=presults[0].mealDate;
                    prevtimestamp=presults[0].timestamp;

                }

                // Invoke callback
                callback(err, results, nextmealdate, nexttimestamp, prevmealdate, prevtimestamp);

            }); // prevPage toArray

        }); // Original query toArray

    }); // getCollection(mealinfo)

}

getMealInfoFromMongoRev = function(username, md, ts, limit, viewDeleted, callback) {
    getMealInfoFromMongoRev_int(username, md, ts, limit, viewDeleted, true, callback);
}

getMealInfoFromMongoRevMenu = function(username, md, ts, limit, viewDeleted, callback) {
    getMealInfoFromMongoRev_int(username, md, ts, limit, viewDeleted, false, callback);
}


getMealInfoFromMongoVerifyRev = function(beforeTs, limit, callback) {

    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);

        mealInfo.find({timestamp: { $lt: beforeTs }, verifiedByAdmin: false, worldViewable: true})
        .sort( { timestamp : -1 } ) .limit(limit) .toArray( function(err, results) {
            if(err) throw(err);
            callback(err, results);
        });
    });
}


getMealInfoFromMongoVerify = function(timestamp, afterTs, limit, callback) {

    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);

        mealInfo.find(  {timestamp: { $gt: afterTs }, verifiedByAdmin: false } )
        .sort( { timestamp : -1 } ) .limit(limit) .toArray( function(err, results) {
            if(err) throw(err);
            callback(err, results);
        });
    });
}

updateMealInfoPicInfoInMongo = function(mymealinfo, callback) {

    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);

        // Some sanity checks
        if(mymealinfo.username == undefined) {
            throw new Error('updateMealInfoPicInfoInMongo called with undefined username');
        }
        if(mymealinfo.timestamp == undefined) {
            throw new Error('updateMealInfoPicInfoInMongo called with undefined timestamp');
        }
        if(mymealinfo.timestamp <= 0) {
            throw new Error('updateMealInfoPicInfoInMongo called with invalid timestamp');
        }

        mealInfo.update({username: mymealinfo.username, timestamp:mymealinfo.timestamp}, 
            {$set: {picInfo: mymealinfo.picInfo}}, {safe:true}, function(err) {
                if(err) throw(err);
                callback(err);
            });

    });
}

setMealInfoInMongo = function(mymealinfo, callback) {
    getCollection('mealInfo', function(error, mealInfo) {
        if(error) throw (error);

        // Some sanity checks
        if(mymealinfo.username == undefined) {
            throw new Error('setMealInfoInMongo called with undefined username');
        }
        if(mymealinfo.timestamp == undefined) {
            throw new Error('setMealInfoInMongo called with undefined timestamp');
        }
        if(mymealinfo.timestamp <= 0) {
            throw new Error('setMealInfoInMongo called with invalid timestamp');
        }

        // Insert the meal information
        mealInfo.insert(mymealinfo, {safe:true}, function(err, object) {
            if(err) throw (err);
            callback(err, object);
        });
    });
}

getMealThumbFromMongoById = function( id, callback ) {
    getCollection('mealThumbs', function(error, mealThumbs) {
        if(error) throw (error);

        mealThumbs.find( {_id: id }).toArray( function( err, results) {
            if(err) throw(err);
            if(results.length > 1) {
                throw new Error(results.length + ' thumbs in Mongo for id' + id);
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

// Get a thumbnail image from mongodb
getMealThumbFromMongo = function(username, timestamp, callback) {
    getCollection('mealThumbs', function(error, mealThumbs) {
        if(error) throw (error);

        mealThumbs.find( {username:username, timestamp: timestamp}).toArray( function( err, results) {
            if(err) throw(err);
            if(results.length > 1) {
                throw new Error(results.length + ' thumbs in Mongo for ' + username + ' timestamp ' + timestamp);
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

// Set a meal-thumb
setMealThumbInMongo = function(mealthumb, callback) {
    getCollection('mealThumbs', function(error, mealThumbs) {
        if(error) throw (error);

        mealThumbs.insert(mealthumb, {safe:true}, function(err, object) {
            if(err) throw (err);
            callback( err, object );
        });
    });
}

// Set a meal picture
setMealPicInMongo = function(mealpic, callback) {
    getCollection('mealPics', function(error, mealPics) {
        if(error) throw (error);

        mealPics.insert(mealpic, {safe:true}, function(err, object) {
            if(err) throw (err);
            callback( err, object );
        });
    });
}


// Retrieve a meal picture from mongodb
getMealPicFromMongo = function(username, timestamp, callback) {
    getCollection('mealPics', function(error, mealPics) {
        if(error) throw (error);

        mealPics.find( {username:username, timestamp: timestamp}).toArray( function( err, results) {
            if(err) throw(err);
            if(results.length > 1) {
                throw new Error(results.length + ' pics in Mongo for ' + username + ' timestamp ' + timestamp);
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

// Configuration
app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session( {
        secret: 'sexbomb-bastic',
        store: new RedisStore,
        cookie: {
            maxAge: maxCookieAge
        }
    }));
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
    app.use(getGeoIp);
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
function showMealPicture( req, res ) {
    // Retrieve the meal thumbnail
    getMealPicFromMongo(req.params.username, parseInt(req.params.timestamp, 10), function(err, mealpic) {

        if(err || mealpic == undefined) {
            // TODO - create a default 'not-found' picture. 
            // res.writeHead(200, {'Content-Type': 'image/jpeg' });
            // res.end( notfound.pic, 'binary');
            showNotFoundPicture(req, res);
            return;
        }
        // Display the image if we got it
        if(mealpic.worldViewable || mealpic.username == req.session.user.username) {
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
    showMealPicture(req, res);
});

var showFavicon = function(req, res) {

    // Read it from disk the first time.
    if(favicon == null) {
        fs.readFile('protected/mealfavicon.ico', function(err, img) {
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
        fs.readFile('protected/nomeal.png', function(err, img) {
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
        fs.readFile('protected/notfound.png', function(err, img) {
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
        fs.readFile('protected/notfoundthumb.png', function(err, img) {
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
app.get('/images/nomeal.png', function(req, res) {
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

// Retrieve a thumbnail
app.get('/thumbs/:username/:timestamp', function(req, res) {

    // Retrieve the meal thumbnail
    getMealThumbFromMongo(req.params.username, parseInt(req.params.timestamp, 10), function(err, mealthumb) {

        if(err) throw (err);

        // Show an error image, or something
        if(mealthumb == undefined) {
            // TODO: create a default 'not-found' picture. 
            // res.writeHead(200, {'Content-Type': 'image/jpeg' });
            // res.end( notfound.pic, 'binary');
            console.log('mealthumb is undefined for objectid ' + req.params.id);
        }

        // Display the image if we got it
        if(mealthumb.worldViewable || mealthumb.username == req.session.user.username) {
              res.contentType(mealthumb.imageType);
              res.end(mealthumb.image, 'binary');
        } 
        // This user isn't privledged to see this
        else {
              // TODO - create a default 'no permission' picture. 
              // res.writeHead(200, {'Content-Type': 'image/jpeg' });
              // res.end( nopermission.pic, 'binary');
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

function deletePicFromAttributesPage(req, res, user, timestamp) {

    setDeleteFlagInMongo(user.username, timestamp, function(err, record, updated) {
        if(err) throw(err);

        user.numPics -= record.picInfo.length;
        updateCurrentNumPicsInMongo(user.username, user.numPics, function(err) {
            if(err) throw(err);
            // TODO 
            res.redirect('/upload');
            return;
        });
    });
    return;
}

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

// Create a new user object & set default attributes.
function User(username, password) {
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
    this.maxPics = 1000;
    this.numPics = 0;
    this.showMealsPerPage = 9;
    this.defaultWorldViewable = false;
    this.isAdmin = false;
    this.lastIp = "";
    this.lastGeo = 0;
    this.lastLatitude = 0;
    this.lastLongitude = 0;
}

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
    this.username = user.username;

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

    // Whether this is world viewable
    this.worldViewable = user.defaultWorldViewable;

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
    this.maxPicsPerMeal = defaultMaxPicsPerMeal;

    // Restaurant: reference to the restaurants table
    this.restaurantId = -1;

    // What does this user have to say about this
    this.review = "";

    // The user hasn't submitted anything yet
    this.tmpReview = "";
}

// Create a thumbnail object for mongo.
function mealThumb(username, picInfo, image, imageType) {
    this.username = username;
    this.timestamp = picInfo.timestamp;
    this.imageType = imageType;
    this.image = image;
}

// Create a pic object for mongo
function mealPic(username, picInfo, image, imageType) {
    this.username = username;
    this.timestamp = picInfo.timestamp;
    this.imageType = imageType;
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
        var user = new User(tmpuser.username, tmpuser.password);

        // Add to the user's table
        setNewUserInMongo(user, function(err, reply) {

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

    if(req.body.username != req.session.user.username) {
        console.log('mismatched usernames in savereview request:');
        console.log('session user is ' + req.session.user.username);
        console.log('request user is ' + req.body.username);
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
    if(req.body.username != req.session.user.username) {
        console.log('mismatched usernames in savereview request:');
        console.log('session user is ' + req.session.user.username);
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
    if(req.session.last_saveinfo != undefined &&
            (Date.now() - req.session.last_saveinfo) < infoUpdateMs) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "toosoon"}));
        res.end();
        return;
    }

    req.session.last_saveinfo = Date.now();

    updateReviewInMongo(req.body.username, parseInt(req.body.timestamp), req.body.review,
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

app.post('/saverating', function(req, res, next) {

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
    if(req.body.username != req.session.user.username) {
        console.log('mismatched usernames in saverating request:');
        console.log('session user is ' + req.session.user.username);
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
    if(req.session.last_saveinfo != undefined &&
            (Date.now() - req.session.last_saveinfo) < infoUpdateMs) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "toosoon"}));
        res.end();
        return;
    }

    req.session.last_saveinfo = Date.now();

    updateRatingInMongo(req.body.username, parseInt(req.body.timestamp), parseInt(req.body.rating),
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
    if(req.body.username != req.session.user.username) {
        console.log('mismatched usernames in savemeal request:');
        console.log('session user is ' + req.session.user.username);
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
    if(req.session.last_saveinfo != undefined &&
            (Date.now() - req.session.last_saveinfo) < infoUpdateMs) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "toosoon"}));
        res.end();
        return;
    }

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
    if(req.body.username != req.session.user.username) {
        console.log('mismatched usernames in savetitle request:');
        console.log('session user is ' + req.session.user.username);
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
    if(req.session.last_saveinfo != undefined &&
            (Date.now() - req.session.last_saveinfo) < infoUpdateMs) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "toosoon"}));
        res.end();
        return;
    }

    req.session.last_saveinfo = Date.now();

    updateTitleInMongo(req.body.username, parseInt(req.body.timestamp), req.body.title,
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
    if(req.session.last_savereviewtmp != undefined && 
            (Date.now() - req.session.last_savereviewtmp) < tmpReviewUpdateMs) {
                /*
        console.log('dropping early *' + req.body.source + '* tmpreview for user ' + 
                req.body.username + ' timestamp ' + req.body.timestamp);
                */
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({message: "okay"}));
        res.end();
        return;
    }

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

    var username = req.query.username;
    var timestamp = parseInt(req.query.timestamp);
    var picArray = [];

    if(req.session.user == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ errStr: "baduser" }));
        res.end();
        return;
    }

    if(req.session.user.username != username && req.session.user.isAdmin == false) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ errStr: "wronguser" }));
        res.end();
        return;
    }

    // Either admin or normal case, lookup mealinfo 
    getOneMealInfoFromMongo(username, timestamp, function(err, mealInfo) {
        if(err) throw(err);
        if(undefined == mealInfo) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ errStr: "nomeal" }));
            res.end();
            return;
        }

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

function editpagenextprev(req, res, next, mealDate, timestamp, isprev) {
    // No real need to pass this back and forth...
    var count = parseInt(req.query.count, 10);
    var md;

    // Should be an initial query.
    if(mealDate == -1) {
        md = dateToMealDate(new Date(), MAXMEAL);
        ts = Date.now();
    }
    else {
        md = mealDate;
        ts = timestamp;
    }

    if(isprev == false) {

        getMealInfoFromMongoRevMenu(req.session.user.username, md, ts, count, false, 
                function(err, mealinfo, nextmd, nextts, prevmd, prevts) {

            // Add a hex-id to each of my mealinfos
            if(mealinfo.length == 0 && mealDate != -1) {

                // Huh?  We shouldn't really get here
                console.log('Illogical state in editpagenextprev: next record not found?');
                md = dateToMealDate(new Date(), MAXMEAL);

                getMealInfoFromMongoRevMenu(req.session.user.username, md, ts, count, false, 
                    function(err, mealinfo, nextmd, nextts, prevmd, prevts) {

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify(
                            {
                                message: "success",
                                mealinfo: mealinfo,
                                nextmd: nextmd,
                                nextts: nextts,
                                prevmd: prevmd,
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
                                nextmd: nextmd,
                                nextts: nextts,
                                prevmd: prevmd,
                                prevts: prevts
                            }));
                res.end();
                return;
            }
        });
    }
    else { // isprev == true

        getMealInfoFromMongoFwdMenu(req.session.user.username, md, ts, count, false, 
                function(err, mealinfo, nextmd, nextts, prevmd, prevts) {

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(
                    {
                        message: "success",
                        mealinfo: mealinfo,
                        nextmd: nextmd,
                        nextts: nextts,
                        prevmd: prevmd,
                        prevts: prevts
                    }));
            res.end();
        }); // getMealInfoFromMongoFwd
    }
}

function editpagenextprevstart(req, res, next, mealDate, timestamp, isprev) {
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

    if(req.query.username != req.session.user.username) {
        console.log('mismatched usernames in editpagenext request:');
        console.log('session user is ' + req.session.user.username);
        console.log('request user is ' + username);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "baduser"}));
        res.end();
        return;
    }

    editpagenextprev(req, res, next, mealDate, timestamp, isprev);
}

// Do the 'nextpage' & lookup picture logic first.
app.get('/deletemeal', function(req, res, next) {

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

    if(req.session.user.username != req.query.username) {
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

    var nextmd = parseInt(req.query.nextmd, 10);
    var nextts = parseInt(req.query.nextts, 10);
    var prevmd = parseInt(req.query.prevmd, 10);
    var prevts = parseInt(req.query.prevts, 10);

    var timestamp = parseInt(req.query.timestamp, 10);
    var count = parseInt(req.query.count, 10);

    setDeleteFlagInMongo(req.query.username, timestamp, function(err, record, updated) {

        // Items in the trash can will be purged to make room for new pictures.  The 
        // dumb way to implement this is to only show the last X deleted things in 
        // reverse order of the time they're deleted.

        if(err) throw(err);
        if(record && record.picInfo) {
            req.session.user.numPics -= record.picInfo.length;
        }
        updateCurrentNumPicsInMongo(req.session.user.username, req.session.user.numPics, function(err) {
            if(err) throw(err);

            // I could probably run this code asynchronous to the delete to 
            // gain a little performance- the risk is that the user will 
            // page around a bit, and see the deleted record. 

            if(prevmd > 0) {
                getMealInfoFromMongoFwdMenu(
                    req.session.user.username, 
                    prevmd,
                    prevts,
                    count, 
                    false, 
                    function(err, mealinfo, nextmd, nextts, prevmd, prevts) {

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.write(JSON.stringify(
                                {
                                    message: "success",
                                    mealinfo: mealinfo,
                                    nextmd: 0,
                                    nextts: 0,
                                    prevmd: prevmd,
                                    prevts: prevts
                                }));
                        res.end();
                    }); // getMealInfoFromMongoFwd
            }
            else {

                // We're authenticated.. get the nextpage mealinfo.
                getMealInfoFromMongoRevMenu(
                        req.session.user.username, 
                        nextmd, 
                        nextts,
                        count, 
                        false, 
                        function(err, mealinfo, nextmd, nextts, prevmd, prevts) {

                            if(err) throw(err);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.write(JSON.stringify(
                                    {
                                        message: "success",
                                        mealinfo: mealinfo,
                                        nextmd: nextmd,
                                        nextts: nextts,
                                        prevmd: 0,
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
    if(req.query.prevpage == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "badrequest"}));
        res.end();
        return;
    }
    editpagenextprevstart(req, res, next, parseInt(req.query.prevmd, 10), parseInt(req.query.prevts, 10), true);
});

// Ajax get info
app.get('/editpagenext', function(req, res, next) {
    if(req.query.nextpage == undefined) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({errStr: "badrequest"}));
        res.end();
        return;
    }
    editpagenextprevstart(req, res, next, parseInt(req.query.nextmd, 10), parseInt(req.query.nextts, 10), false);
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
        if (err) {
            // Just throw it for now.
            throw (err);
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
                var user = new User(tmpuser.username, tmpuser.password);

                // Add to mongo user's table
                setNewUserInMongo(user, function(err, reply) {

                    if (err) throw (err);

                    // Delete the key
                    redisClient.del(req.params.id, function(err, reply) {} );

                    // Make the session user-aware
                    req.session.user = user;

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

var editmealsPage = function(req, res, next, mealDate, timestamp, isprev, viewDeleted) {
    var ts;
    var md;
    var prevpage = 0;

    if (req.session.user == undefined) {
        req.session.nextpage = '/editmeals';
        res.redirect('/signin');
        return;
    }

    if(mealDate == -1) {
        md = dateToMealDate(new Date(), MAXMEAL);
    }
    else
    {
        md = mealDate;
    }
    
    if(isprev == false) {
        getMealInfoFromMongoRev(req.session.user.username, md, ts, req.session.user.showMealsPerPage, viewDeleted, function(err, mealinfo, nextmd, nextts, prevmd, prevts) {
            // Add a hex-id to each of my mealinfos
            if(mealinfo.length == 0 && timestamp != -1) {

                ts = Date.now();

                getMealInfoFromMongoRev(req.session.user.username,ts, req.session.user.showMealsPerPage, viewDeleted, function(err, mealinfo, nextmd, nextts, prevmd, prevts) {
                    res.render('editmeals.ejs', {
                        user: req.session.user,
                        mealinfo: mealinfo,
                        nextmd: nextmd,
                        nextts: nextts,
                        prevmd: prevmd,
                        prevts: prevts
                    });
                });
            }
            else {
                res.render('editmeals.ejs', {
                    user: req.session.user,
                    mealinfo: mealinfo,
                    nextmd: nextmd,
                    nextts: nextts,
                    prevmd: prevmd,
                    prevts: prevts
                });
            }
        });
    }
    else { // prevpage is true
        getMealInfoFromMongoFwd(req.session.user.username, ts, req.session.user.showMealsPerPage, viewDeleted, function(err, mealinfo, nextmd, nextts, prevmd, prevts) {
            res.render('editmeals.ejs', {
                user: req.session.user,
                mealinfo: mealinfo,
                nextmd: nextmd,
                nextts: nextts,
                prevmd: prevmd,
                prevts: prevts
            });
        }); // getMealInfoFromMongoFwd
    }
};

// Check the form data from the editmeals page
function editmealsPostDeleteMeals(req, res, next, isprev) {
    
    var sendCount = 0;
    var rcvCount = 0;
    var pollTime = 0;
    var diskSpace = 0;

    // Count everything that you are going to send
    for(var i = 0 ; i < req.session.user.showMealsPerPage ; i++) {

        var property = "delchk" + i;

        if(undefined != req.body[property]) {
            sendCount++;
        }
    }

    for(var i = 0 ; i < req.session.user.showMealsPerPage ; i++) {

        var property = "delchk" + i;

        if(undefined != req.body[property]){

            var varray = req.body[property].split('/');
            var uname = varray[0];
            var tstamp = parseInt(varray[1], 10);

            // Set the 'deleted' flag - we'll actually delete this some time later
            setDeleteFlagInMongo(uname, tstamp, function(err, updated) {

                if(err) throw(err);

                // updated will be 'true' if something was actually updated.
                if(updated == false) {
                    sendCount--;
                }
                else {
                    rcvCount++;
                }

                // Last complete
                if(rcvCount == sendCount) {

                    req.session.user.numPics -= sendCount;

                    // This shouldn't happen ..
                    if(req.session.user.numPics < 0) {
                        console.log("session numPics is less than 0?  " + req.session.user.numPics);
                        req.session.user.numPics = 0;
                    }

                    updateCurrentNumPicsInMongo(req.session.user.username, req.session.user.numPics, function(err) { 
                        if(err) throw(err);
                    });

                    // Continue here
                    if(req.params.timestamp == undefined) {
                        res.redirect('/editmeals');
                    }
                    else { 
                        res.redirect('/editmeals/' + req.params.timestamp);
                    }

                    return;
                }
            });
        }
    }
}

app.post('/editmealsuploadfail', function(req, res, next) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('Failure');
    res.end();
});

function editmealsPost(req, res, next, isprev) {

    // Sanity check - verify this user
    if(req.session.user == undefined) {
        req.session.nextpage = '/editmeals';
        res.redirect('/signin');
        return;
    }

    // Check to see if this user is requesting that some of their meals be deleted
    if(undefined == req.files || undefined == req.files.upload || undefined == req.files.upload.path) {
        editmealsPostDeleteMeals(req, res, next, isprev);
        return;
    }

}

app.post('/editmeals', function(req, res, next) {
    editmealsPost(req, res, next, false);
});

app.post('/editmeals/:timestamp', function(req, res, next) {
    editmealsPost(req, res, next, false);
});

app.post('/editmealsprev/:timestamp', function(req, res, next) {
    editmealsPost(req, res, next, true);
});

app.post('/editmeals_change_pics/:newpics/:timestamp', function(req, res, next) {
    editmealsPost(req, res, next, false);
});

app.post('/editmeals_change_pics/:newpics', function(req, res, next) {
    editmealsPost(req, res, next, false);
});

app.get('/editmealsprev/:timestamp', function(req, res, next) {
    editmealsPage(req, res, next, parseInt(req.params.mealDate, 10), parseInt(req.params.timestamp, 10), true, false);
});

app.get('/editmeals/:timestamp', function(req, res, next) {
    editmealsPage(req, res, next, parseInt(req.params.mealDate, 10), parseInt(req.params.timestamp, 10), false, false);
});

app.get('/editmeals',  function( req, res, next) {
    editmealsPage(req, res, next, -1, -1, false, false);
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
function edit_upload_internal_2(req, res, next, picinfo, image, thumbwidth, thumbheight) {

    var mealthumb = new mealThumb(req.session.user.username, picinfo, image, req.files.inputUpload.type);
    setMealThumbInMongo(mealthumb, function(mterr, object) {

        if(mterr) throw (mterr);
        var successResp = "SUCCESS " + picinfo.timestamp + " " + picinfo.height;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(successResp);
        res.end();
    });
}

// TODO: write a scaling function would clean this up quite a bit
function edit_upload_internal_1(req, res, next, image, mealinfo, picinfo) {

    // Scale to thumbnail dimensions
    var scaleThumbWidth;
    var scaleThumbHeight;

    // Scale to whichever is the furthest out of whack.
    if(picinfo.width > maxThumbWidth && picinfo.height > maxThumbHeight) {
        // Scaled difference
        var testwidth = picinfo.width / maxThumbWidth;
        var testheight = picinfo.height / maxThumbHeight;

        // Width is further out of whack, so scale to width
        if (testwidth > testheight) {
            scaleThumbWidth = maxThumbWidth;
            scaleThumbHeight = (maxThumbWidth / picinfo.width) * picinfo.height;
        }
        // Height is further out of whack, so scale to width
        else {
            scaleThumbHeight = maxThumbHeight;
            scaleThumbWidth = (maxThumbHeight / picinfo.height) * picinfo.width;
        }
    }
    // Only the width is out of bounds
    else if(picinfo.width > maxThumbWidth) {
        scaleThumbWidth = maxThumbWidth;
        scaleThumbHeight = (maxThumbWidth / picinfo.width) * picinfo.height;
    }
    // Only the height is out of bounds
    else if(picinfo.height > maxThumbHeight){
        scaleThumbHeight = maxThumbHeight;
        scaleThumbWidth = (maxThumbHeight / picinfo.height) * picinfo.width;
    }
    else {
        scaleThumbHeight = picinfo.height;
        scaleThumbWidth = picinfo.width;
    }

    // Set thumb width and height in mealinfo
    picinfo.thumbWidth = scaleThumbWidth;
    picinfo.thumbHeight = scaleThumbHeight;


    req.session.user.numPics++;

    updateCurrentNumPicsInMongo(req.session.user.username, req.session.user.numPics, function(err) { 
        if(err) throw(err);
    });

    var mealpic = new mealPic(req.session.user.username, picinfo, image, req.files.inputUpload.type);
    setMealPicInMongo(mealpic, function(err, object) {

        if(err) throw(err);

        // Push the new picture onto the mealinfo's picinfo array
        mealinfo.picInfo.push(picinfo);
        
        // Update the picinfo array in the mealInfo object
        updateMealInfoPicInfoInMongo(mealinfo, function(merror, object) {

            if(merror) throw(merror);

            if(mealinfo.width <= maxThumbWidth && mealinfo.height <= maxThumbHeight) {
                edit_upload_internal_2(req, res, next, picinfo, image, picinfo.width, picinfo.height );
                return;
            }

            // The thumbnail is last.  An earlier version used to return control to the 
            // user here.  This was to do the thumbnail creation-processing out-of-band:
            // If the user requests the thumbnail and it hasn't made it to mongo, I can 
            // always send the full picture.
            im.resize( { 
                srcData: image,
                width: scaleThumbWidth,
                height: scaleThumbHeight
            }, // The resized image is stdout.
            function(err, stdout, stderr) {

                if(err) throw (err);
                edit_upload_internal_2(req, res, next, picinfo, stdout, scaleThumbWidth, scaleThumbHeight);
                return;
            });
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

// Massage a mealpic that the user has just uploaded
function editMealsUploadPost(req, res, mealinfo, next) {

    imageFeatures(req.files.inputUpload.path, function(err, features) {

        if(err) {
            console.log("Error identifying uploaded file: " + req.files.inputUpload.path);
            req.session.uploadmsg = "Error uploading your file!";

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(req.session.uploadmsg);
            res.end();

            return;
        }

        if(features.width <= maxMealWidth && features.height <= maxMealHeight) {
            fs.readFile(req.files.inputUpload.path, "binary", function(error, image) {
                var picinfo = new picInfo(
                    mealinfo.timestamp,
                    req.files.inputUpload.name, 
                    req.files.inputUpload.size, 
                    features.width,
                    features.height,
                    req.files.inputUpload.type,
                    features);

                edit_upload_internal_1(req, res, next, image, mealinfo, picinfo);
            });
            return;
        }

        var scaleWidth;
        var scaleHeight;

        // For this case, scale to whichever is the furthest out of whack.
        if(features.width > maxMealWidth && features.height > maxMealHeight) {
            // Scaled difference
            var testwidth = features.width / maxMealWidth;
            var testheight = features.height / maxMealHeight;

            // Width is further out of whack, so scale to width
            if (testwidth > testheight) {
                scaleWidth = maxMealWidth;
                scaleHeight = (maxMealWidth / features.width) * features.height;
            }
            // Height is further out of whack, so scale to width
            else {
                scaleHeight = maxMealHeight;
                scaleWidth = (maxMealHeight / features.height) * features.width;
            }
        }
        // Only the width is out of bounds
        else if(features.width > maxMealWidth) {
            scaleWidth = maxMealWidth;
            scaleHeight = (maxMealWidth / features.width) * features.height;
        }
        // Only the height is out of bounds
        else {
            scaleHeight = maxMealHeight;
            scaleWidth = (maxMealHeight / features.height) * features.width;
        }

        // Okay - resize this and then upload
        im.resize( { 
            srcPath: req.files.inputUpload.path,
            width: scaleWidth, 
            height: scaleHeight
        }, // The resized image is stdout.
        function(err, stdout, stderr) {
            // There will be a new size here ..
            // XXX picinfo not mealinfo
                var picinfo = new picInfo(
                    mealinfo.timestamp,
                    req.files.inputUpload.name, 
                    stdout.length,
                    scaleWidth,
                    scaleHeight,
                    req.files.inputUpload.type,
                    features);

                edit_upload_internal_1(req, res, next, stdout, mealinfo, picinfo);
        });

        return;
    });
}


app.post('/editmealsupload', function(req, res, next) {

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
        console.log('mismatched usernames in savemeal request:');
        console.log('session user is ' + req.session.user.username);
        console.log('request user is ' + req.body.username);
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

    getOneMealInfoFromMongo(req.body.username, parseInt(req.body.mealInfo, 10), function(err, mealInfo) {
        if(err) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write("BAD-REQUEST");
            res.end();
            return;
        }

        // Verify that we're allowed to upload another picture
        if(mealInfo.maxPicsPerMeal > 0 && 
            mealInfo.picInfo.length >= mealInfo.maxPicsPerMeal) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write("HAVE MAXIMUM PICS FOR THIS MEAL");
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
    if(req.query.username != req.session.user.username) {
        console.log('mismatched usernames in savemeal request:');
        console.log('session user is ' + req.session.user.username);
        console.log('request user is ' + req.body.username);
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

// Display the verify meals page
function verifyMeals(req, res, next, timestamp) {
    if(!verifyAdmin(req,res,next)) {
        return;
    }

    getMealInfoFromMongoVerifyRev(timestamp, req.session.user.showMealsPerPage + 1, function(err, mealinfo) {
        res.render('verify_meals.ejs', {
            picsperpage: req.session.user.showMealsPerPage,
            mealinfo: mealinfo,
            timestamp: timestamp
        });
    });

}

function verifyMealsPost(req, res, next) {
    if(!verifyAdmin(req,res,next)) {
        return;
    }

    // Go through all of the elements of req.body
    for( var i = 0 ; i < req.session.user.showMealsPerPage ; i++) {

        var property = "verchk" + i;

        if(undefined != req.body[property]) {

            // Found a verified picture
            var vfy = "verify" + i;

            // Grab the username, timestamp, and judgement
            var varray = req.body[vfy].split('/');
            var uname = varray[0];
            var tstamp = varray[1];

            var allow;
            if (varray[2] == "Allow") {
                allow = true;
            } 
            else if (varray[2] == "Disallow") {
                allow = false;
            }
            else {
                throw new Error("Unexpected value for varray[2]:" + varray[2]);
            }
            getOneMealInfoFromMongo(uname, parseInt(tstamp, 10), function(err, mealInfo){

                if(undefined == mealInfo) {
                    throw new Error("Null mealinfo for username " + uname + " timestamp " + tstamp);
                }

                mealInfo.verifiedByAdmin = true;
                mealInfo.adminAllow = allow;

                updateVerifyMealInfoInMongo(mealInfo, function(err) {
                    if(err) throw(err);
                });

            });
        }
    }
}

app.post('/admin_verify_meals/:timestamp', function(req,res,next, timestamp) {
    verifyMealsPost(req, res, next);
});

app.get('/admin_verify_meals/:timestamp', function(req, res, next) {
    verifyMeals(req, res, next, parseInt(req.params.timestamp, 10));
});

// Page for an administrator to verify that the meal are okay for public display
app.get('/admin_verify_meals', function(req, res, next) {
    res.redirect('/admin_verify_meals/' + Date.now());
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
app.listen(webPort, function(){
    console.log( org + ' started on port ' + webPort);
});

