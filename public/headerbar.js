// Header bar - will contain the user menus

var headerbar = (function ($jq) {

    // Cache jQuery
    var $ = $jq;

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

    // Reference to the unordered list
    var ulist;

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

    // Contains the iconinfo for the home icon
    var homeicon = null;

    // Div holding home icon
    var homeicondiv = null;

    // Contains the iconinfo for editmeals
    var editmealsicon = null;

    // Contains the iconinfo for user preferences
    var userprefsicon = null;

    // Contains the iconinfo for about us
    var abouticon = null;

    // The height of a navdiv
    var navdivheight;

    // The width of a navdiv
    var navdivwidth;

    // Top menu margin
    var menumargintop;

    // Bottom menu margin
    var menumarginbottom;

    // Right menu margin
    var menumarginright;

    // Left menu margin
    var menumarginleft;

    // Grid nav width
    var headernavwidth;

    // Inner width
    var headernavinnerwidth;

    // Grid nav height
    var headernavheight;

    // Count of menu items
    var menucount = 0;

    // Width of a single menu element
    var menuelementwidth;

    // Home icon li
    var homeli;
    
    // Create element wrapper
    var dc = function(a) {
        return document.createElement(a);
    }

    // Create a li
    function navli(name, cls) {

        var nli = $(dc('li'))
            .attr('id', name)
            .attr('class', cls)
            .css('float', 'left')
            .css('padding', '0px')
            .css('text-align', 'center')
            .css('position', 'relative')
            .css('margin-left', '0px')
            .css('margin-right', '0px')
            .css('margin-top', '0px')
            .css('margin-bottom', '0px')
            .css('display', 'inline-block')
            .css('height', gridnavheight + 'px')
            .css('width', menuelementwidth + 'px')
            .css('display', 'inline-block');

        return nli;
    }

    // Same function as headernav's version
    function navdiv(name, cls) {

        var ndiv = $(dc('div'))
            .attr('id', name)
            .attr('class', cls)
            //.css('background-color', '#fff')
            .css('width', navdivwidth + 'px')
            .css('height', navdivheight + 'px')
            //.css('color', '#bbb')
            /*
            .css('box-shadow', '3px 3px 5px #444')
            .css('-webkit-box-shadow', '3px 3px 5px #444')
            .css('-moz-box-shadow', '3px 3px 5px #444')
            */
            .css('margin-top', menumargintop + 'px')
            .css('margin-bottom', menumarginbottom + 'px')
            .css('margin-left', menumarginleft + 'px')
            .css('margin-right', menumarginright + 'px')
            .css('float', 'left')
            .css('text-align', 'center');

        return ndiv;
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
            .attr('id', 'headerbarinner')
            .attr('class', 'headerbarinner')
            .css('margin-left', outermarginleft + 'px')
            .css('margin-right', outermarginright + 'px')
            .css('width', headerbarinnerwidth + 'px')
            .css('position', 'absolute');

        // Append this to the navcontainer
        headerbarinner.appendTo(headerbarcontainer);

        return headerbarcontainer;
    }

    function createicondiv(iconinfo) {

        var backgroundstring = 'transparent url(' + iconinfo.name + ') no-repeat';

        if(iconinfo.position) {
            backgroundstring += ' ' + iconinfo.position;
        }
        else {
            backgroundstring += ' top left';
        }

        var topmargin = Math.floor((navdivheight - iconinfo.height) / 2);

        var dv = $(dc('div'))
            .css('width', iconinfo.width + 'px')
            .css('height', iconinfo.height + 'px')
            .css('background', 'transparent')
            .css('text-indent', '-9000px')
            .css('background', backgroundstring)
            .css('margin-top', topmargin + 'px')
            .html('.');

        var leftmargin = Math.floor((navdivwidth - iconinfo.width) / 2);

        // If this isn't floating center it
        if(!iconinfo.imgfloat) {
            dv.css('margin-left', leftmargin + 'px');
        }

        return dv;
    }

    function gethomeicondiv(iconinfo) {
        
        if(!homeicondiv) {
            homeicondiv = createicondiv(iconinfo);
            if(iconinfo.imgfloat) {
                homeicondiv.css('float', iconinfo.imgfloat);
            }
            homeicondiv.css('title', 'Home')
        }
        return homeicondiv;
    }

    function homeiconli() {

        // Get the prev li
        var homeli = navli('home', 'home');

        // Get homeli div
        var homediv = gethomeicondiv();

        // Append it to the homeli
        homediv.appendTo(homeli);

        // Return it
        return homeli;
    }

    // Display the headerbar
    function displayheader()
    {
        // Don't redras
        if(isdisplayed) {
            return false;
        }

        // Create the container
        makecontainer();

        // Set to true
        isdisplayed = true;

        return true;
    }

    // Initialize headerbar
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

        // Top menu margin
        menumargintop = cfg.hp("menumargintop") ? cfg.menumargintop : 10;

        // Bottom menu margin
        menumarginbottom = cfg.hp("menumarginbottom") ? cfg.menumarginbottom : 10;

        // Right menu margin
        menumarginright = cfg.hp("menumarginright") ? cfg.menumarginright : 20;

        // Left menu margin
        menumarginleft = cfg.hp("menumarginleft") ? cfg.menumarginleft : 20;

        // Width
        headernavwidth = cfg.hp("headernavwidth") ? cfg.headernavwidth : 1180;

        // Height
        headernavheight = cfg.hp("headernavheight") ? cfg.headernavheight : 120;

        // Get home iconinfo
        if(cfg.homeicon) {
            homeicon = cfg.homeicon;
            menucount++;
        }

        // Editmeals icon info
        if(cfg.editmealsicon) {
            editmealsicon = cfg.editmealsicon;
            menucount++;
        }

        // User prefs icon info
        if(cfg.userprefsicon) {
            userprefsicon = cfg.userprefsicon;
            menucount++;
        }

        // About icon info
        if(cfg.abouticon) {
            abouticon = cfg.abouticon;
            menucount++;
        }

        // Width of the interior header bar
        headerbarinnerwidth = headerbarwidth - (outermarginleft + outermarginright);

        // Calculate the width of a single menu element
        menuelementwidth = Math.floor( headerbarinnerwidth / menucount );

        // Calculate navdiv height
        navdivheight = headernavheight - (menumargintop + menumarginbottom);

        // Calculate navdiv width
        navdivwidth = menuelementwidth - (menumarginleft + menumarginright);
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

        // Create an unordered list
        ulist = $(dc('ul'))
            .attr('id', 'headerbarnavid')
            .attr('class', 'headerbarnavul')
            .css('position', 'static')
            .css('clear', 'both')
            .css('overflow', 'hidden')
            .css('list-style-type', 'none')
            .css('padding', '0px')
            .css('float', 'left')
            .css('margin', '0px')
            .css('text-align', 'center')
            .css('height', headernavheight + 'px')
            .css('width', headerbarinnerwidth + 'px');

        // Append to the container
        ulist.appendTo(headerbarinner);

        if(homeicon) {

            // Create icon list element
            homeli = homeiconli();

            // Append icon to th eul
            homeli.appendTo(ulist);
        }

        // Set to true
        isdisplayed = true;

    }

    return {
        init                        : init,
        displayheader               : displayheader
    };
}(jQuery));
