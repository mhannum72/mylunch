var sqlite = require('node-sqlite');

var db = new sqlite.Database();

db.open("restaurant.db", function(err) {
    if(err) {
        console.log("Error");
        throw err;
    }
    db.executeScript ("CREATE VIRTUAL TABLE gpsdata USING RTREE(id, minx, maxx, miny, maxy);" , function(err) {
        if(err) throw err;

        db.execute("INSERT INTO gpsdata(id, minx, maxx, miny, maxy) values (?, ?, ?, ?, ?)", [ 1, 50, 50, 100, 100 ], 
            function(error, rows) {
                if(error) throw error;
                console.log('rows added to gpsdata');
            });
    });

    db.executeScript ("CREATE VIRTUAL TABLE restaurant USING fts4(id, ranking, name, address, phone, tokenize=porter);", function(err) {
        if(err) throw err;
        db.execute("INSERT INTO restaurant(id, ranking, name, address, phone) values (?, ?, ?, ?, ?)", [ 1, 1, 'Olive Garden', '123 4th Street', '123-345-9890' ], 
            function(error, rows) {
                if(error) throw error;
                console.log('rows added to restaurant');
            });
    });

});
