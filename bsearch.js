// This is a quick benchmark of a linear search vs binary search in javascript
// The results: you do better using a linear search if the size of an array is
// less than 100 elements.

// Number of elements in the array
var maxelm = 100;
var iter = 1000000;

function bsearch(array, element) {
    var left = 0;
    var right = array.length;
    var ii = Math.floor(left + ( (right - left) / 2));

    while(true) {
            
        if(array[ii].element == element) return ii;

        if(element > array[ii].element)
            left = ii+1;
        else if(element < array[ii].element)
            right = ii;

        if(left >= right) return -1;

        ii = Math.floor(left + ( (right - left) / 2));
    }
}

function lsearch(array, element) {
    var ii;

    for(ii = 0 ; ii < array.length; ii++) {
        if(array[ii].element == element) return ii;
        if(array[ii].element > element) return -1;
    }
    return -1;
}

// Fill the array
var array = [];
var ii;
var last = 0;

// Get this working, and then increase the size to a 'picinfo' element
function sobj(element) {
    this.element = element;
    this.data = [];
    for(var ii = 0 ; ii < 64; ii++) {
        this.data.push(ii);
    }
    return this;
}

for(ii = 0 ; ii < maxelm; ii++) {
    array[ii] = new sobj(ii);
}

var start = Date.now();
for(ii = 0 ; ii < iter ; ii++) {
    bsearch(array, ii);
}
var end = Date.now();
var tot = end - start;

console.log("elapsed time for bsearch of " + iter + " elements is " + tot);

var start = Date.now();
for(ii = 0 ; ii < iter ; ii++) {
    lsearch(array, ii);
}
var end = Date.now();
var tot = end - start;
console.log("elapsed time for lsearch of " + iter + " elements is " + tot);

