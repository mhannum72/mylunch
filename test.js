var fs = require('fs');
var util = require('util');
var features;

fs.readFile('out', function(err, out) {
    var lines = out.toString().split(/\n/);
    for(var i = 0 ; i < lines.length ; i++) {
        var line = lines[i].trim();
        var array = line.split(/\|/);
        var property = array[0];
        var value = array[1];
        //line = regEx.exec(lines[i]);
        console.log('(' + property +  ') -> (' + value + ')');
    }
});
