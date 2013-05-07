

// Utility functions
var lutil = (function($jq) {

    // Cache jquery
    var $ = $jq;

    // Image is loaded or cached function
    function imageready(image, callback, tag) {

        var im = image;
        var tg = undefined != tag ? "." + tag : "";

        // Normalize this 
        if(Array.isArray(image)) {

            im = image[0];

        }

        // Invoke callback if ready
        if(im.complete) {

            callback();
            return;

        }

        // Wait for this image to load
        image.on("load" + tg, function() {

            image.off("load" + tg);
            callback();
            return;

        });

    }

    // Exposed functions
    return {
        imageready                  : imageready
    }

}(jQuery));
