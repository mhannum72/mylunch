// Search for a specific timestamp
var findpicidx = (function(cfg) {

    // 100 or less does better with linear search
    var optcutoff = (cfg && cfg.optcutoff) ? cfg.optcutoff : 100;

    // Binary search function
    function binarysearch(pinfo, timestamp) {

        var left = 0;
        var right = pinfo.length;
        var ii = Math.floor(left + ((right - left) / 2));

        // This shouldn't happen
        if(!pinfo || pinfo.length <= 0) {
            console.log('Error: findpicidx called with a null pinfo');
        }

        // Loop
        while(true) {

            // Found index
            if(pinfo[ii].timestamp == timestamp)
                return ii;

            // Change left endpoint
            if(timestamp > pinfo[ii].timestamp)
                left = ii + 1;

            // Change right endpoint
            else if(timestamp < pinfo[ii].timestamp)
                right = ii;

            // Didn't find it
            if(left >= right) return -1;

            // Next element
            ii = Math.floor(left + ( (right - left) / 2));
        }
    }

    // Linear search function
    function linearsearch(pinfo, timestamp) {
        for(var ii = 0 ; ii < pinfo.length ; ii++) {
            if(pinfo[ii].timestamp == timestamp)
                return ii;
        }
        return -1;
    }

    // Use binary search if it pays off
    function optimalsearch(pinfo, timestamp) {
        if(pinfo.length < optcutoff) {
            return linearsearch(pinfo, timestamp);
        }
        else {
            return binarysearch(pinfo, timestamp);
        }
    }

    return {
        linearsearch    : linearsearch,
        binarysearch    : binarysearch,
        search          : optimalsearch
    };
}( 
    // XXX Do different browsers have different cutoffs? XXX
    { optcutoff : 100 } 
));

