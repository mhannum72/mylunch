
// Codo which will implement a simple drop-down menu
var ddmenu = (function ($jq) {

    // Cache jquery
    var $ = $jq;

    // Creates and returns a menu - the menu will have an 'additem' and 
    // 'removeitem' method which allows you to add and remove items.  Maybe
    // it will also have a 'settitle' method?  Not sure yet.
    //
    // Oh .. menus should also implment an 'open' and 'close' function which
    // can be called to display and undisplay the menu.  So the menu might 
    // be opened on a certain event (like a hover), and closed on another 
    // event (when the mouse exits).
    function makemenu() {
    }

    return {
        makemenu                    : makemenu,
    };

}(jQuery));
