
/**
 * Module dependencies.
 */

var express = require('express');
var fs = require('fs');
var http = require('http');
var url = require('url');
var im = require('imagemagick');
var gm = require('gm');
var mongo = require('mongodb'),
    Server = mongo.Server,
    Db = mongo.Db;
//var session = require('session');
var user;
var tables;
var gbl_user;
var server = new Server('localhost', 27017, { auto_reconnect: true });
var db = new Db('mylunch', server);
var do_refresh = 1;
var lastimage = 0;
var global_files;
var dirlist;

// XXX TODO : make base directory an env option, create accounts
var basedir = '/data/mhannum/thumbs/';
//var app = module.exports = express.createServer(form({keepExtensions: true}));
var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
//    app.use(express.bodyParser({ limit: '2mb' }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
//    app.use(function(req,res) {
//        res.send('error');
//    });
});


// add a bit of error handling
// XXX keep this - i'm studying it.
app.use(function errorHandler(err, req, res, next) {
    if (err.status) res.statusCode = err.status;
    if (res.statusCode < 400) res.statusCode = 500;
    var accept = req.headers.accept || '';

    if (!accept.indexOf('html')) {
        var stack =  err.stack || '' ;
        console.log('case 1');
    } else if (~accept.indexOf('json')) {
        var error = { message: err.message, stack: err.stack };
        console.log('case 2');
    } else {
        console.log('case 3');
    }
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
    //res.writeHead(200, {'Content-Type': 'image/jpeg' });
    //res.writeHead(200, {'Content-Type': 'image/jpeg' });
    res.writeHead(200, {'Content-Type': 'image/jpeg' });
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
    //    console.log("In chooseimage.  lastimage is " + lastimage);
    image = files[lastimage++ % files.length];
    showimage(req, res, err, image);
}

app.get('/image*', function(req, res) {
    if (do_refresh) {
        fs.readdir(basedir, function(err, files) {
            if (err) throw err;
            global_files = files;
            chooseimage(req, res, err, files);
        });
        do_refresh = 0;
    }
    else {
        chooseimage(req, res, 0, global_files);
    }
});


app.get('/upload', function(req, res) {
    res.render('upload.ejs');
//    res.send('<form method="post" enctype="multipart/form-data">'
//    + '<p>Image: <input type="file" name="image" /></p>'
//    + '<p><input type="submit" value="Upload" /></p>'
//    + '</form>');
//    res.render('upload.ejs');
});

app.post('/upload', function(req, res, next) {
//    console.log(req.body);
    console.log(req.files);
    fs.readFile(req.files.upload.path, "binary", function(error, file) {
        if(error) {
            throw(error);
        }
//        var now = Date.now();
//        var newpic = { 'username': gbl_user.username, 'time_uploaded': now, 'picture': file };

//        gbl_lunches_table.insert(newpic, function(err, result) {
//            if(err) {
//                throw (err);
//            }
//        });
    });
//    gm.scale(req.files.upload.path).write("/tmp/test1.JPG", function(err) {
//    gm(req.files.upload.path).size(function(err, size) {
//        var end = Date.now();
//        var elapsed = end - start;
//        res.writeHead(200, {'content-type': 'text/plain'});
//        res.end('elapsed-time:' + elapsed);
//        console.log('width is ' + size.width );
//        console.log('height is ' + size.height );
//    });
//    im.readMetadata(req.files.upload.path, function(err, metadata) {
//        var end = Date.now();
//        var elapsed = end - start;
//        if (err) {
//            console.log('I am in an error condition');
//            throw (err);
//        }
//        res.writeHead(200, {'content-type': 'text/plain'});
//        res.end('elapsed-time:' + elapsed);
//        res.end('shot at ' + metadata.exif.dateTimeOriginal);
//        console.log('metadata.exif: ' + metadata.exif);
//    });
});

//app.get('*', function(req, res) {
//    res.end('what??', 404);
//});

//app.get('/', function(req, res) {
//    res.render('index.ejs', { 
//        title: 'MYLUNCH.ORG'
//    });
//});

// app.get(':id/upload', function(req, res) {
//});

// Open everything that we need to open

// Asynchronous initialization 
db.open(function(err, db){
    if(err) throw (err);
    db.collection('users', { safe: true }, function(err, utable) {
        if(err) throw (err);
        tables.users_table = utable;
        db.collection('lunches', { safe: true }, function( err, lunches) {
            if(err) throw (err);
            tables.lunches_table = lunches;
            db.collection('session', { safe: true }, function( err, sesst) {
                if(err) throw (err);
                tables.sessions_table = sesst;
                session.initSession(tables);
                app.listen(3000, function(){
                    console.log('Server listening on port 3000');
                });
            });
        });
    });
});




