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
    //var homeli; 

    // Edit icon li
    //var editli;

    // User prefs li
    //var userpli;

    // Create element wrapper
    var dc = function(a) {
        return document.createElement(a);
    }

    // Create a li
    function navli(id, cls) {

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
            .css('height', headernavheight + 'px')
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

    // Create an icon image object
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
            .css('position', 'absolute')
            //.css('left', iconinfo.loffset + 'px')
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

    function icondiv(iconinfo, id, cls, title) {

        var rdv = navdiv(id + 'div', cls + 'div');

        var anchor = $(dc('a'))
            .attr('id', id + 'anchor')
            .attr('href', 'javascript:void(0)');

        // Put a reference to this anchor in my iconinfo
        iconinfo.anchor = anchor;

        if(iconinfo && iconinfo.width <= navdivwidth &&
                iconinfo.height <= navdivheight) {

            var idv = createicondiv(iconinfo);
            idv.attr('title', title);
            idv.appendTo(anchor);
        }
        else {
            rdv.html(title);
        }

        anchor.appendTo(rdv);

        return rdv;
    }


    function iconli(iconinfo, id, cls, title) {

        // Get a new li
        var li = navli(id, cls);

        // Get a new div
        var dv = icondiv(iconinfo, id, cls, title);

        // Append to the li
        dv.appendTo(li);

        // Return it
        return li;
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

        // Calculate absolute placement here of the icons:  First icon starts 
        // at left-offset 0, then increment by (totalwidth / (numicons - 1)) 
        // for each subsequent icon.
        //
        // I think this ratio is correct even for placing the icon within the 
        // containing div.  That is, the placements should be:
        //
        // 0 * (divwidth / (numicons - 1)) 
        // 1 * (divwidth / (numicons - 1))
        // 2 * (divwidht / (numicons - 1))
        // (etc.)
        //
        // I'm not religious about these things, and there's no 'const' in 
        // javascript, so possibly tack this calculation onto the iconinfo 
        // object right here.
        //
        // TODO: calculate gridnav this way as well (the current method is
        // wrong for anything other than than 3 icons).

        // I think navdivwidth is correct
        /* This is all wrong apparently */
        /*
        var increment = navdivwidth / (menucount - 1);

        // Initialize counter
        var counter = 0;

        if(homeicon) {
            homeicon.loffset = Math.floor( counter * increment );
            counter++;
        }

        if(editmealsicon) {
            editmealsicon.loffset = Math.floor( counter * increment );
            counter++;
        }

        if(userprefsicon) {
            userprefsicon.loffset = Math.floor( counter * increment );
            counter++;
        }

        if(abouticon) {
            abouticon.loffset = Math.floor( counter * increment );
            counter++;
        }
        */
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
            var homeli = iconli(homeicon, 'home', 'home', 'Home');

            // Append icon to th eul
            homeli.appendTo(ulist);
        }

        // Append edit meals icon
        if(editmealsicon) {

            // Create the list element
            var editli = iconli(editmealsicon, 'editmeals', 'editmeals', 'Edit Meals');

            // Append to ulist
            editli.appendTo(ulist);

        }

        if(userprefsicon) {

            // Create list element
            var userpli = iconli(userprefsicon, 'userprefs', 'userprefs', 'User Preferences');

            // Append to ulist
            userpli.appendTo(ulist);
        }

        if(abouticon) {

            // Create list element
            var aboutpli = iconli(abouticon, 'abouticon', 'abouticon', 'About Us');


            // Append to ulist
            aboutpli.appendTo(ulist);
        }

        // Set to true
        isdisplayed = true;

    }

    return {
        init                        : init,
        displayheader               : displayheader
    };
}(jQuery));
