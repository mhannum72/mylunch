
// Codo which will implement a simple drop-down menu
var ddmenu = (function ($jq) {

    // Cache jquery
    var $ = $jq;

    // Creates and returns a menu - the menu will have an 'additem' and
    // maybe a 'removeitem' method which allows you to add and remove items.  
    // Maybe it will also have a 'settitle' method?  Not sure yet.
    //
    // Oh .. menus should also implment an 'open' and 'close' function which
    // can be called to display and undisplay the menu.  So the menu might 
    // be opened on a certain event (like a hover), and closed on another 
    // event (when the mouse exits).
    //
    // I'm not sure how much would be good to implement here .. each menu 
    // item could take a function which defines hover behavior (which 
    // might well be null).  The 'target' might be baked into the item itself.
    // 
    // Here might be a use case:
    //
    // var submenu = ddmenu.makemenu();
    // var mainmenu = ddmenu.makemenu();
    //
    // submenu.additem("Submenu item 1");
    // submenu.additem("Submenu item 2");
    // submenu.additem("Submenu item 3");
    //
    // mainmenu.additem("<a href='http://whatever.com'>Home</a>", null);
    // mainmenu.additem("Test submenu", function() { submenu.open(); } , function() { submenu.close(); } );
    //
    // This might not be too difficult.  The thing which should be returned 
    // from makemenu is a 'ul' type containing the rest of the menu.  Someone
    // can easily wrap this in jquery and 'appendTo' menu headers.
    //
    // Create element wrapper
    var dc = function(a)
    {
        return document.createElement(a);
    }

    // Return the ul header for menus
    function makeul() {

        // Create the ul container
        var ul = $(dc('ul'))
            .css('position', 'relative');

        return ul[0];
    }

    function makeli(menter, mleave) {

        // Create the li 
        var li = $(dc('li'))
            .css('float', 'left');

        // Set mouseenter function
        if(menter) {
            li.mouseenter(function() { menter(); });
        }

        // Set mouseleave function
        if(mleave) {
            li.mouseleave(function() { mleave(); });
        }
    }

    function additem(payload, menter, mleave) {

        // This should be a ul
        var ul = $(this);

        // Create an li
        var li = makeli(menter, mleave);

        // Append it to this ul
        if(!ul.firstli) {
            ul.firstli = li;
        }

        // Set next of the last li
        if(ul.lastli) {
            ul.lastli.nextli = li;
        }

        // Set new last li
        ul.lastli = li;

        // Increment counter
        ul.licount++;

        // Append element
        li.appendTo(ul);

        // Append payload to the li
        if(payload) {
            $(payload).appendTo(li);
        }
    }

    // This is going to return a 'ul' with a few functions attached to it
    function makemenu(titlepayload) {

        // Create the ul container
        var menu = makeul();

        // Set the last li to null
        menu.lastli = null;

        // Set the first li to null
        menu.firstli = null;

        // Keep a count of the items
        menu.licount = 0;

        // Not sure if this will work with the 'this' keyword
        menu.additem = additem;

        // Add a title
        menu.additem(titlepayload, null, null);

        // Return this menu
        return menu;
    }

    return {
        makemenu                    : makemenu,
    };

}(jQuery));
