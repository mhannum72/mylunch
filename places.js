// Express
var express = require('express');

// Create a server
var app = module.exports = express.createServer();

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
});


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

app.get('/placestest', function(req, res, next) {
    res.render('placestest.ejs');
});

app.get('/autotest', function(req, res, next) {
    res.render('autotest.ejs');
});

app.get('/simple', function(req, res, next) {
    res.render('simple.ejs');
});

app.get('/autotest', function(req, res, next) {
    res.render('autotest.ejs');
});

app.get('/datetest', function(req, res, next) {
    res.render('datetest.ejs');
});

app.get('/placesautocomplete', function(req, res, next) {
    res.render('placesautocomplete.ejs');
});

app.listen(2000, function(){
    console.log( 'Started on port ' + 2000);
});

