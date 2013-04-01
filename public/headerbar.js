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

    // Hold the headerbar container
    var headerbarcontainer;

    // Inner part of the headerbar
    var headerbarinner;

    // Set to true if being displayed
    var isdisplayed = false;

    // Outer margin left
    var outermarginleft;

    // Outer margin right
    var outermarginright;

    // Callback to see if the modal is up
    var modalisupcb;

    // Get the inner width
    var headerbarinnerwidth;

    // Top margin for the container
    var containertopmargin;

    // Create element wrapper
    var dc = function(a) {
        return document.createElement(a);
    }

    // Make the container
    function makecontainer() {

        // Create the navcontainer
        headerbarcontainer = $(dc('div'))
            .attr('id', 'headerbarcontainer')
            .attr('class', 'headerbarcontainer')
            .css('width', headerbarwidth + 'px')
            .css('height', headerbarheight + 'px')
            .css('box-shadow', '3px 3px 5px #444')
            .css('-webkit-box-shadow', '3px 3px 5px #444')
            .css('-moz-box-shadow', '3px 3px 5px #444')
            .css('-moz-border-radius', '15px')
            .css('border-radius', '15px')
            .css('border', '1px solid')
            .css('margin-top', containertopmargin + 'px')
            .css('background-color', '#eee')
            .css('position', 'relative');

        // Make the inner div
        headerbarinner = $(dc('div'))
            .attr('id', 'navinner')
            .attr('class', 'navinner')
            .css('margin-left', outermarginleft + 'px')
            .css('margin-right', outermarginright + 'px')
            .css('width', headerbarinnerwidth + 'px')
            .css('position', 'absolute');

        // Append this to the navcontainer
        headerbarinner.appendTo(headerbarcontainer);

        return headerbarcontainer;

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

        // Left outer margin
        outermarginleft = cfg.hp("outermarginleft") ? cfg.outermarginleft : 10;

        // Right outer margin
        outermarginright = cfg.hp("outermarginrigh") ? cfg.outermarginright : 10;

        // Set to the callback which tells if the modal is up
        modalisupcb = cfg.hp("modalisup") ? cfg.modalisup : null;

        // Top margin of the container
        containertopmargin = cfg.hp("containertopmargin") ? cfg.containertopmargin : 30;

        // Width of the interior header bar
        headerbarinnerwidth = headerbarwidth - (outermarginleft + outermarginright);

    }

    // Display the header
    function displayheader() {

        // Don't redraw
        if(isdisplayed) {
            return false;
        }

        // Create the container
        makecontainer();

        // Attach this to the parent div
        if(parentdiv) {
            headerbarcontainer.appendTo(parentdiv);
        }

        // Set to true
        isdisplayed = true;

    }

    return {
        init                        : init,
        displayheader               : displayheader
    };
}(jQuery));
