// Header bar - will contain the user menus

var headerbar = (function ($jq) {

    // Where this will appear on the page
    var parentdiv;

    // Who is running this
    var username;

    // How wide is this headerbar
    var headerbarwidth;

    // How tall is this headerbar
    var headerbarheight;

    // Create element wrapper
    var dc = function(a) {
        return document.createElement(a);
    }

    function init(indiv, uname, cfg) {

        // Shorten function name
        cfg.hp = cfg.hasOwnProperty;

        // Where this will appear on the page
        parentdiv = indiv;

        // Current user
        username = uname;

        // Width
        headerbarwidth = cfg.hp("headerbarwidth") ? cfg.headerbarwidth : 1180;

        // Height
        headerbarheight = cfg.hp("headerbarheight") ? cfg.headerbarheight : 120;


    }

    // Display the header
    function displayheader() {
    }

    return {
        init                        : init,
        displayheader               : displayheader
    };
}(jQuery));
