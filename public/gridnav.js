// Grid navigation bar - should maintain nextpage, prevpage, fast-scan,
// and the 'new-meal'
var gridnav = (function ($jq) {

    // Cache jQuery
    var $ = $jq;

    // Where this will appear on the page
    var parentdiv;

    // Who is running this
    var username;

    // Left margin
    var marginleft;

    // Right margin
    var marginright;

    // Top margin
    var margintop;

    // Bottom margin
    var marginbottom;
    
    // The nav div
    var navcontainer;

    // The inner div
    var navinner;

    // The container width
    var gridnavwidth;

    // Derived bar width
    var gridinnerwidth;

    // The container height
    var gridnavheight;

    // The height of a navdiv
    var navdivheight;

    // The width of a navdiv
    var navdivwidth;

    // The next page div
    var nextpagediv;

    // Prev page div
    var prevpagediv;

    // The next page li
    var nextli;

    // The prev page li
    var prevli;

    // New meal div
    var newmealdiv;

    // Date nav div
    var datenavdiv;

    // Set to true when gridnav is being displayed
    var isdisplayed = false;

    // Reference to the unordered list
    var ulist;

    // Count of the list elements
    var menucount;

    // Width of each width element
    var menuelementwidth;
 
    // Outer margin left
    var outermarginleft;

    // Outer margin right
    var outermarginright;

    // Outer margin top
    var outermargintop;

    // Outer margin bottom
    var outermarginbottom;

    // Top menu margin
    var menumargintop;

    // Bottom menu margin
    var menumarginbottom;

    // Right menu margin
    var menumarginright;

    // Left menu margin
    var menumarginleft;

    // Set to 1 if we want a next
    var hasnextpage;

    // Set 1 if we want to display the prevdiv
    var hasprevpage;

    // Set 1 if we want a newmeal icon
    var hasnewmeal;

    // Set 1 if we want the date navigator
    var hasdatenav;

    // Holds the 'prev-page' div
    var prevdiv;

    // Holds the 'next-page' div
    var nextdiv;

    // Holds the newmeal anchor
    var newmealanchor;

    // Holds previous page icon's pinfo 
    var prevpageicon;

    // Holds img for prevpage icon
    var prevpageicondiv;

    // Holds next page icon's pinfo
    var nextpageicon;

    // Holds img for nextpage icon
    var nextpageicondiv;

    // Create element wrapper
    var dc = function(a) {
        return document.createElement(a);
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

        var dv = $(dc('div'))
            .css('width', iconinfo.width + 'px')
            .css('height', iconinfo.height + 'px')
            .css('background', 'transparent')
            .css('text-indent', '-9000px')
            .css('background', backgroundstring)
            .css('margin', '0 auto')
            .html('.');

        return dv;
    }

    // Get / create a prev-page image icon
    function getprevpageiconimg(iconinfo) {
        if(!prevpageicondiv) {
            prevpageicondiv = createicondiv(iconinfo);
            prevpageicondiv.css('float', 'left')
                .attr('title', 'Previous Meals');
        }
        return prevpageicondiv;
    }

    // Get / create a prev-page image icon
    function getnextpageiconimg(iconinfo) {
        if(!nextpageicondiv) {
            nextpageicondiv = createicondiv(iconinfo);
            nextpageicondiv.css('float', 'right')
                .attr('title', 'Next Meals');
        }
        return nextpageicondiv;
    }

    // Get / create the datenav div
    function getdatenavdiv() {

        if(!datenavdiv) {

            datenavdiv = navdiv('datenavdiv', 'datenavdiv').html('Date Navigator');

        }
        return datenavdiv;
    }

    // Get / create the newmealdiv
    function getnewmealdiv() {

        if(!newmealdiv) {

            newmealdiv = navdiv('newmealdiv', 'newmealdiv');

            // Create new meal anchor
            var nma = $(dc('a'))
                .attr('id', 'newmealpopup')
                .attr('href', 'javascript:void(0)')
                .html('New Meal');

            // Append to the navdiv
            nma.appendTo(newmealdiv);

            // Get non-jquery version
            newmealanchor = nma[0];

        }
        return newmealdiv;
    }

    // Get / create the nextpagediv
    function getnextpagediv() {

        if(!nextpagediv) {

            nextpagediv = navdiv('nextpagediv', 'nextpagediv');

            // Append the nextpage anchor - use an img
            if(nextpageicon && nextpageicon.width <= navdivwidth && 
                    nextpageicon.height <= navdivheight) {
                var nexticon = getnextpageiconimg(nextpageicon);
                nexticon.appendTo(nextpagediv);
            }
            else {
                nextpagediv.html('Next Page');
            }

        }
        return nextpagediv;
    }

    // Get / create the prevpagediv
    function getprevpagediv() {

        if(!prevpagediv) {

            prevpagediv = navdiv('prevpagediv', 'prevpagediv');

            // Append the prevpage anchor - use an img
            if(prevpageicon && prevpageicon.width <= navdivwidth &&
                    prevpageicon.height <= navdivheight) {
                var previcon = getprevpageiconimg(prevpageicon);
                previcon.appendTo(prevpagediv);
            }
            else {
                prevpagediv.html('Previous Page');
            }
        }
        return prevpagediv;
    }

    // Return the newmealanchor
    function getnewmealanchor() {

        if(!newmealanchor) {
            getnewmealdiv();
        }

        return newmealanchor;
    }

    // Create the navigation container
    function makecontainer() {

        // Create the navcontainer
        navcontainer = $(dc('div'))
            .attr('id', 'navcontainer')
            .attr('class', 'navcontainer')
            .css('width', gridnavwidth + 'px')
            .css('height', gridnavheight + 'px')
            .css('box-shadow', '3px 3px 5px #444')
            .css('-webkit-box-shadow', '3px 3px 5px #444')
            .css('-moz-box-shadow', '3px 3px 5px #444')
            .css('-moz-border-radius', '15px')
            .css('border-radius', '15px')
            .css('border', '1px solid')
            .css('background-color', '#eee')
            .css('position', 'relative');

        // Make the inner div
        navinner = $(dc('div'))
            .attr('id', 'navinner')
            .attr('class', 'navinner')
            .css('margin-left', outermarginleft + 'px')
            .css('margin-right', outermarginright + 'px')
            .css('width', gridinnerwidth + 'px')
            .css('position', 'absolute');

        // Append this to the navcontainer
        navinner.appendTo(navcontainer);

        return navcontainer;

    }

    // Return the next-page div
    function nextpage() {
        return (getnextpagediv())[0];
    }

    // Return the prev-page link
    function prevpage() {
        return (getprevpagediv())[0];
    }

    // Get a standard nav-div
    function navdiv(name, cls) {

        var ndiv = $(dc('div'))
            .attr('id', name)
            .attr('class', cls)
            //.css('background-color', '#fff')
            .css('width', navdivwidth + 'px')
            .css('height', navdivheight + 'px')
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

    // Create the newmeal list element
    function newmealli() {

        // Create the newmeal li
        var newmli = navli('newmeal', 'newmeal');

        // Get the newmealli div
        var newmdiv = getnewmealdiv();

        // Append to the newmealli
        newmdiv.appendTo(newmli);

        // Return it
        return newmli;
    }

    // Create the previous list element
    function prevpageli() {

        // Create the prev li
        var prevli = navli('prevpage', 'prevpage');

        // Get prevpage div
        var prevdiv = getprevpagediv();

        // Append it to the prevli
        prevdiv.appendTo(prevli);

        // Return it
        return prevli;
    }

    // Create the nextpage list element
    function nextpageli() {

        // Create the prev li
        var nextli = navli('nextpage', 'nextpage');

        // Next page div
        var nextdiv = getnextpagediv();

        // Append it to the prevli
        nextdiv.appendTo(nextli);

        // Return it
        return nextli;

    }

    // Create the datenav list element
    function datenavli() {

        // Create the date nav li
        var dateli = navli('datenav', 'datenav');

        // Get the datenav div
        var datediv = getdatenavdiv();

        // Append it to the dateli
        datediv.appendTo(dateli);

        // Return it
        return dateli;

    }

    // Callback for the grid object
    function nextprevcallback( pvpage, nxpage, pvanchor, nxanchor ) {

        if(pvpage) {

            // Detach prevpagediv from whatever
            prevpagediv.detach();

            // Clear out pvanchor if its there
            prevli.empty();

            // Append new prevanchor 
            pvanchor.appendTo(prevli);

            // Append prevpagediv to prevanchor
            prevpagediv.appendTo(pvanchor);

            //prevpagediv.attr('disabled', 'false');
        }
        else {

            // Detach prevpagediv from whatever
            prevpagediv.detach();

            // Clear prevli - zap prevanchor
            prevli.empty();

            // Append
            //prevpagediv.appendTo(prevli);

            // TODO : shadow this out somehow?
            //prevpagediv.attr('disabled', 'true');
        }

        if(nxpage) {

            // Detach nextpagediv
            nextpagediv.detach();

            // Clear out nxanchor if its there
            nextli.empty();

            // Append new nxanchor
            nxanchor.appendTo(nextli);

            // Append nextpagediv to nxanchor
            nextpagediv.appendTo(nxanchor);
        }
        else {

            // Detach nextpagediv
            nextpagediv.detach();

            // Clear nextli - zap nextanchor
            nextli.empty();

            // Append
            //nextpagediv.appendTo(nextli);
        }
    }

    // Create and draw the nav object
    function displaynav() {

        // Don't redraw
        if(isdisplayed) {
            return false;
        }

        // We'll be displaying soon
        isdisplayed = true;

        // Create the container
        makecontainer();

        // Attach this to the parent div
        if(parentdiv) {
            navcontainer.appendTo(parentdiv);
        }

        // Create an unordered list
        ulist = $(dc('ul'))
            .attr('id', 'gridnavid')
            .attr('class', 'gridnavul')
            .css('position', 'static')
            .css('clear', 'both')
            .css('overflow', 'hidden')
            .css('list-style-type', 'none')
            .css('padding', '0px')
            .css('float', 'left')
            .css('margin', '0px')
            .css('text-align', 'center')
            .css('height', gridnavheight + 'px')
            .css('width', gridinnerwidth + 'px');

        // Append to the container
        ulist.appendTo(navinner);

        // Add prevpage if that was requested
        if(hasprevpage) {

            // Create prev list element
            prevli = prevpageli();
    
            // Append prevli to the ul
            prevli.appendTo(ulist);

        }

        // Maybe newmeal comes first
        if(hasnewmeal) {

            // Create the newmeal li element
            var newmli = newmealli();

            // Append newmealli to the ul
            newmli.appendTo(ulist);

        }

        // Add datenav if that was requested
        if(hasdatenav) {

            // Create the date nav element
            var datenv = datenavli();

            // Append it to the ul
            datenv.appendTo(ulist);

        }

        // Add nextpage if that was requested
        if(hasnextpage) {

            // Create next list element
            nextli = nextpageli();

            // Append nextli to the ul
            nextli.appendTo(ulist);

        }
    }

    // Initialize the gridnav object
    function init(indiv, uname, cfg) {

        // Shorten function name
        cfg.hp = cfg.hasOwnProperty;

        // Where this will appear on the page
        parentdiv = indiv;

        // Current user
        username = uname;

        // Top margin
        margintop = cfg.hp("margintop") ? cfg.margintop : 10;

        // Bottom margin
        marginbottom = cfg.hp("marginbottom") ? cfg.marginbottom : 10;

        // Width
        gridnavwidth = cfg.hp("gridnavwidth") ? cfg.gridnavwidth : 1180;

        // Height
        gridnavheight = cfg.hp("gridnavheight") ? cfg.gridnavheight : 120;

        // Top outer margin
        outermargintop = cfg.hp("outermargintop") ? cfg.outermargintop : 10;

        // Bottom outer margin
        outermarginbottom = cfg.hp("outermarginbottom") ? cfg.outermarginbottom : 10;

        // Left outer margin
        outermarginleft = cfg.hp("outermarginleft") ? cfg.outermarginleft : 10;

        // Right outer margin
        outermarginright = cfg.hp("outermarginrigh") ? cfg.outermarginright : 10;

        // Top menu margin
        menumargintop = cfg.hp("menumargintop") ? cfg.menumargintop : 10;

        // Bottom menu margin
        menumarginbottom = cfg.hp("menumarginbottom") ? cfg.menumarginbottom : 10;

        // Right menu margin
        menumarginright = cfg.hp("menumarginright") ? cfg.menumarginright : 20;

        // Left menu margin
        menumarginleft = cfg.hp("menumarginleft") ? cfg.menumarginleft : 20;

        // Set to 1 if has next div
        hasnextpage = cfg.hp("hasnextpage") ? (cfg.hasnextpage ? 1 : 0 ) : 1;

        // Set to 1 if has prev div
        hasprevpage = cfg.hp("hasprevpage") ? (cfg.hasnextpage ? 1 : 0 ) : 1;

        // Set to 1 if we have a newmeal icon
        hasnewmeal = cfg.hp("hasnewmeal") ? (cfg.hasnewmeal ? 1 : 0 ) : 1;

        // Set to 1 if we have a date navigator
        hasdatenav = cfg.hp("hasdatenav") ? (cfg.hasdatenav ? 1 : 0 ) : 0;

        // Set to the prev-page icon's pinfo
        prevpageicon = cfg.hp("prevpageicon") ? cfg.prevpageicon : null;

        // Set to the next-page icon's pinfo
        nextpageicon = cfg.hp("nextpageicon") ? cfg.nextpageicon : null;

        // Set the menucount
        menucount = (hasnextpage + hasprevpage + hasnewmeal + hasdatenav);

        // Get the inner width
        gridinnerwidth = gridnavwidth - (outermarginleft + outermarginright);

        // Calculate the width of a single menu element
        menuelementwidth = Math.floor( (gridinnerwidth) / menucount );

        // Calculate navdiv height
        navdivheight = gridnavheight - (menumargintop + menumarginbottom);

        // Calculate navdiv width
        navdivwidth = menuelementwidth - (menumarginleft + menumarginright);

    }

    // Exposed functions
    return {
        init                        : init,
        displaynav                  : displaynav,
        nextprevcallback            : nextprevcallback,
        getnewmealanchor            : getnewmealanchor,
        nextpage                    : nextpage,
        prevpage                    : prevpage
    };

}(jQuery));

