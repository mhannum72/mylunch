
// Depends on jquery
<script src="/jquery.js"></script>


// This was try1 at object-oriented-ish javascript.  It works great but I know
// better now.
function createPictureCarousel(username, sourcedir, picinfo, findpicix, keytimestamp) {
    // Create element wrapper
    var dc = function(a)
    {
        return document.createElement(a);
    };

    // Create the carousel div
    var elm = $(dc('div'))
        .attr('id', 'mealcarousel')
        .attr('class', 'mealcarousel')
        .css('height', '780px')
        .css('width', '780px');

    // Store this away
    this.elm = elm;

    // Store the username away
    elm.username = username;

    // Store the source dir
    elm.sourcedir = sourcedir;

    // Keep track of the picture count
    elm.numpics = 0;

    // Set animating flag to false
    elm.animating = false;

    // modkey protects the key images from mouseovers
    elm.modkey = false;

    // Set rotating flag to false
    elm.rotating = false;

    // Set the rotate interval
    elm.rotateinterval = 2000;

    // Set timer name
    elm.rotatetimer = 0;

    // Set addremove flag to false
    elm.addremove = false;

    // Slider speed
    elm.sliderspeed = 600;

    // Delete image speed
    elm.deletespeed = 500;

    // Initial new pic slider speed
    elm.minpicinitspeed = 100;

    // Visible picture
    elm.$currentpic = null;

    // Global easing function
    elm.easing = 'mylunchcarousel';

    // Picinfo to resume loading for delayed start
    elm.startindex = -1;

    // fadeout these at nomeal, fadein at first meal
    elm.fadeobjs = [];

    // Set the find-picture-index function
    elm.findpicix = findpicix;

    // Renamed easeoutexpo function
    if(!jQuery.easing[elm.easing]) {
        jQuery.easing[elm.easing] = function (x, t, b, c, d) {
            return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
        }
    }

    // Create the viewport
    elm.viewport = $(dc('div'))
        .attr('id', 'mealviewport')
        .attr('class', 'mealviewport')
        .css('height', '780px')
        .css('width', '1560px');

    // Append this to elm
    elm.viewport.appendTo(elm);

    // Reset maxheightcnt
    elm.maxheightcnt = 0;

    // Minimum maxheight
    elm.minmaxheight = 256;

    // Maxheight
    elm.maxheight = elm.minmaxheight;

    // Hard code maxwidth
    elm.maxwidth = 780;

    // Create an div which will contain a carousel picture
    elm.picturediv = function(elm, pinfo) {

        // Create div to contain this picture
        var $dv = $(dc('div'))
            .attr('id', 'pic-div-' + pinfo.timestamp)
            .attr('class', 'pic-div')
            .css('width', '0px');

        var $dvint = $(dc('div'))
            .attr('class', 'pic-div-int')
            .css('position', 'absolute')
            .css('height', pinfo.height + 'px')
            .css('width', '780px');

        // Store pinfo 
        $dv[0].pinfo = pinfo;

        // Click-anchor 
        var anchor = $(dc('a'))
            .attr('class', 'pic-div-anchor');

        // Source string
        var img_source = '/' + elm.sourcedir + '/' + elm.username + '/' + pinfo.timestamp;

        // Image tag
        var img = $(dc('img'))
            .attr('class', 'pic-div-image')
            .attr('src', img_source);

        // TODO write picture click handler
        /* 
        anchor.click(function(){

            if(elm.stopped == false) {

                clearTimeout(elm.pictimeout);
                elm.stopped = true;

            }
            else{

                elm.stopped = false;
                rotatepictures(elm);

            }
        });
        */

        // Append image to anchor
        img.appendTo(anchor);

        // Append anchor to internal-div
        anchor.appendTo($dvint);

        // Append internal-div to div
        $dvint.appendTo($dv);

        return $dv;
    }

    // Add a list of objects to fadein / fadeout
    elm.addfadeobj = function(element) {

        // Toggle immediately
        if(elm.numpics == 0)
        {
            $(element).hide();
        }
        else
        {
            $(element).show();
        }

        // Push onto the fadeobjs array
        elm.fadeobjs.push(element);
    }

    // Toggle only if I need to
    elm.viskey = true;

    // Show the key picture icon
    elm.showkey = function(elm) {

        // Toggle if it's not showing
        if(elm.viskey == false) {
            elm.key.css({'opacity':1.0});
            elm.viskey = true;
            
        }
    }

    // Hide the key picture icon
    elm.hidekey = function(elm) {

        // Toggle if it's visible
        if(elm.viskey == true) {
            elm.key.css({'opacity':0.0});
            elm.viskey = false;
        }
    }

    // Show the navigation arrow
    elm.shownav = function(elm) {
        if(elm.nav && elm.prevarrow && elm.nextarrow) {
            elm.nav.css({'opacity':1.0});
        }
    }

    // Hide navigation arrows
    elm.hidenav = function(elm) {
        if(elm.nav && elm.prevarrow && elm.nextarrow) {
            elm.nav.css({'opacity':0.0});
        }
    }

    // Mouse entered the carousel
    elm.mouseenter(function() {

        // Show arrows if they are there
        elm.shownav(elm);

        if(elm.modkey == false) {

            // Show key icon if this is a key photo
            var $dv = elm.$currentpic;

            if($dv && $dv.hasClass('key-picture')) {
                elm.showkey(elm);
            }
            else {
                elm.hidekey(elm);
            }
        }
    });

    // Mouse leaves the carousel
    elm.mouseleave(function() {

        // Fade arrows if they are there
        elm.hidenav(elm);

        // This might already be opaque
        elm.hidekey(elm);

    });

    // Create a div which will display the nomeal icon in the carousel
    elm.nomealdiv = function(elm) {

        // If this has already been created return it
        if(elm.$nomealdiv) {
            return elm.$nomealdiv;
        }

        // Create div to contain this picture
        var $dv = $(dc('div'))
            .attr('id', 'pic-div-nomeal')
            .attr('class', 'pic-div')
            .css('width', '0px');

        // Internal class
        var $dvint = $(dc('div'))
            .attr('class', 'pic-div-int')
            .css('width', '780px');

        // Click-anchor 
        var anchor = $(dc('a'))
            .attr('class', 'pic-div-anchor');

        // Source string
        var img_source = '/images/nomeal.png';

        // Image tag
        var img = $(dc('img'))
            .attr('class', 'pic-div-image')
            .attr('src', img_source);

        // Append these 
        img.appendTo(anchor);
        anchor.appendTo($dvint);
        $dvint.appendTo($dv);

        $dv[0].pinfo = { height: 256, width: 256, timestamp: -1 };
            
        // Cache 
        elm.$nomealdiv = $dv;

        return $dv;
    }

    // No meal
    elm.nomeal = function(elm) {

        // Grab the nomeal div
        var $nomeal = elm.nomealdiv(elm);

        // Grab the nomeal info pointer
        var pinfo = $nomeal[0].pinfo;

        // Append this to my viewport
        $nomeal.appendTo(elm.viewport);

        // Set nomeal height
        $nomeal.css('height', pinfo.height + 'px');

        // Top margin is 0px
        $nomeal.css('margin-top', '0px');

        // Reset carousel height
        elm.css('height', pinfo.height + 'px');
    }

    // Reset max height.  This scans so up the suckage level one notch.
    function findmaxheight(ignorets)
    {
        ignorets = (ignorets ? ignorets : -1);

        // Sanity counter
        var counter = 0;

        // Get a list of the $li elements
        var $dv = elm.find('.pic-div');

        // Reset max height and width
        elm.maxheight = elm.minmaxheight; 

        // Reset counts
        elm.maxheightcnt = 0;

        // Iterate to find maxes
        $dv.each(function(i) {

            if(this.pinfo == undefined) {
                debuglog('pinfo is undefined?');
            }

            // Ignore the picture that's being removed
            if(this.pinfo.timestamp != ignorets) {

                // Height
                if(this.pinfo.height > elm.maxheight) { 
                    elm.maxheight = this.pinfo.height; 
                    elm.maxheightcnt = 1; 
                }
                else if(this.pinfo.height == elm.maxheight) { 
                    elm.maxheightcnt++;
                }
            }

            // Increment counter
            counter++;
        });

        // 'Assert'
        if(elm.numpics > 0 && counter != elm.numpics) {
            debuglog('Error: numpics mismatch!');
        }
    }

    // Creates key picture icon
    function createkey(elm)
    {
        // Key icon div
        elm.key = $(dc('div'))
            .attr('id', 'keyicon')
            .attr('class', 'keyicon');

        // Create key icon span
        elm.keyicon = $(dc('span'))
            .attr('id', 'keyspan')
            .attr('class', 'keyspan')
            .html('Key');

        // Attach key icon to carousel
        elm.keyicon.appendTo(elm.key);
        elm.key.appendTo(elm);
    }

    // Don't need this really
    function destroykey(elm)
    {
        // Remove key span
        elm.keyicon.remove();

        // Set icon to null
        elm.keyicon = null;

        // Remove key
        elm.key.remove();

        // Set to null
        elm.key = null;
    }

    // Creating navigation arraows
    function createarrows(elm)
    {
        // Create navigator div
        elm.nav = $(dc('div'))
            .attr('id', 'navigator')
            .attr('class', 'ca-nav');

        // Create prev-arrow span
        elm.prevarrow = $(dc('span'))
            .attr('class', 'ca-nav-prev')
            .html('Previous');

        // Create next-array span
        elm.nextarrow = $(dc('span'))
            .attr('class', 'ca-nav-next')
            .html('Next');

        // Move on prev click
        elm.prevarrow.click(function() { elm.movebackward(); } );

        // Move on next click
        elm.nextarrow.click(function() { elm.moveforward(); } );

        // Attach arrows to carousel
        elm.prevarrow.appendTo(elm.nav);
        elm.nextarrow.appendTo(elm.nav);
        elm.nav.appendTo(elm);
    }

    // Internal function for destroying navigation arraows
    function destroyarrows(elm)
    {
        // Remove prev arrow
        elm.prevarrow.remove();

        // Set pointer to null
        elm.prevarrow = null;

        // Remove next arrow
        elm.nextarrow.remove();

        // Set pointer to null
        elm.nextarrow = null;

        // Remove nav
        elm.nav.remove();

        // Set pointer to null
        elm.nav = null;
    }

    // Internal function for removing a picture
    function removeinternal(elm, $dv, $target, callback) {

        // Retrieve pinfo for this element
        var pinfo = $target[0].pinfo;

        // Decrement the number of pictures
        --elm.numpics;

        // Check numpics
        if(1 == elm.numpics) {

            // Destroy the navigation arrows
            destroyarrows(elm);
        }
        // Destroy navigation arrows
        else if(0 == elm.numpics) {

            // Fade out all fadeobjs
            elm.fadeobjs.forEach(function(obj) {
                $(obj).hide();
            });
        }

        // Cache old height
        var ht = elm.maxheight;

        // Find new maxheight
        findmaxheight(pinfo.timestamp);

        // Set height if it changed
        if(elm.maxheight != ht) {

            // Find the next element
            var $next = $dv.eq(1);

            // Set elm maxheight
            elm.css('height', elm.maxheight);

            // Set viewport maxheight
            elm.viewport.css('height', elm.maxheight);

            // The display pic has a new maxheight
            if($next.length > 0) {
                var topheight = Math.floor(
                        (elm.maxheight -  $next[0].pinfo.height) / 2);

                // Set top margin
                $next.css('margin-top', topheight + 'px');
            }

            else {
                var $nomeal = nomealdiv(elm);

                $nomeal.css('margin-top', '0px');

                $nomeal.css('height', $nomeal[0].pinfo.height);
            }

        }

        // Unset addremove flag
        elm.addremove = false;

        // Callback with the pinfo for the element just removed
        if(callback) {
            callback(true, pinfo);
        }
    }

    // Remove current picture
    elm.removepicture = function(callback) {

        // Check addremove flag
        if(elm.addremove) {

            debuglog('Removepicture returning because we are add removing.');
            if(callback) callback(false);
            return false;

        }

        // Set addremove flag
        elm.addremove = true;

        // Get a list of the $dv elements
        var $dv = elm.find('.pic-div');

        // Find the div
        var $target = $dv.eq(0);

        // If there are no pictures return
        if($target.length <= 0) {
            elm.addremove = false;
            if(callback) callback(false);
            return false;
        }

        // Get the image inside this div
        var $img = $target.find('.pic-div-image');

        // Grab pinfo for width and height
        var pinfo = $target[0].pinfo;

        // Nomeal height
        var height = 256;

        // Pinfo height
        if(pinfo) {
            height = pinfo.height;
        }

        // Add nomeal to carousel
        if(elm.numpics == 1) {

            // Grab the nomeal div
            var $nomeal = nomealdiv(elm);

            var height = $nomeal[0].pinfo.height;

            // Put if off screen
            $nomeal.css('left', '-10000px');

            $nomeal.css('height', height + 'px');

            // Append this to my viewport
            $nomeal.appendTo(elm.viewport);

            debuglog('check nomeal here');
        }
        else if($target.hasClass('pic-lastts')) {

            // Find the element to the left
            var $pv = $dv.eq(-1);

            // Make it the new lastts
            $pv.addClass('pic-lastts');
        }

        // Disable mouseovers
        elm.modkey = true;

        // Hide the key
        elm.hidekey(elm);

        // Shrink image
        $img.stop().animate(
                {
                    height: '0px',
                    width: '0px',
                    top: '+=' + (height / 2) + 'px'
                }, 
                elm.deletespeed,
                elm.easing,
                function() {

                    // Move forward
                    elm.moveforward(function(moved) { 
                        removeinternal(elm, $dv, $target, callback); 
                    }, 
                    "removepic");
                }
        );
    }

    // Add a picture
    elm.addpicture = function(pinfo, initadd, makekey, callback) {

        // Default to false
        initadd = initadd || false;

        // True means delete the nomeal pic
        var isdel = false;

        // True if this is the first upload
        var isfirst = false;

        // Should we rotate
        var rotate = false;

        // Check addremove flag
        if(elm.addremove) {

            debuglog('Addpicture returning because we are add removing.');
            if(callback) callback(false);
            return false;

        }

        // Set addremove flag
        elm.addremove = true;

        // Create the list element
        var $dv = elm.picturediv(elm, pinfo);

        // Create a div for first picture
        if(elm.numpics == 0) {

            // Set the clear nomeal flag
            isdel = true;

            isfirst = true;

            // Populating the carousel during setup: make this visible
            if(initadd) {
                $dv.css('left', '0px');
            }
            else {
                // Will replace the nomeal pic
                $dv.css('left', '-10000px');
            }

            // Current picture
            /* Maybe delay this until after the rotate? */
            elm.$currentpic = $dv;

            // This is always true now
            rotate = true;

            // Show the fadeobjects
            elm.fadeobjs.forEach(function(obj) {
                $(obj).show();
            });

        }
        // Adding the second picture
        else if(elm.numpics == 1) {

            // Create arrow navigation controls
            createarrows(elm);

            // Not viewable
            $dv.css('left', '-10000px');

            // Rotate to new picture
            rotate = true;
        }
        else {
            // Not viewable
            $dv.css('left', '-10000px');

            // Rotate to new picture
            rotate = true;
        }

        // Undefined by default
        var lastts; 

        // Find the last-timestamp class
        if(elm.numpics > 0) {

            // Find the last picture added
            lastts = elm.find('.pic-lastts');

            // Remove the lastts class
            lastts.removeClass('pic-lastts');

            // Insert the new picture
            $dv.insertAfter(lastts);

        }
        else {
            // Append to viewport
            $dv.appendTo(elm.viewport);
        }

        // This is the new last picture
        $dv.addClass('pic-lastts');

        // Increment picture count
        elm.numpics++;

        // Update maxheight
        if(pinfo.height > elm.maxheight) {

            // Set my maxheight
            elm.maxheight = pinfo.height;

            // Set maxheightcnt
            elm.maxheightcnt = 1;

            // Update elm maxheight
            elm.css('height', elm.maxheight);

            // Update viewport maxheight
            elm.viewport.css('height', elm.maxheight);
        }
        else if(pinfo.height == elm.maxheight) {

            // Increment maxheightcnt
            elm.maxheightcnt++;
        }

        // Save current slider speed
        var cursliderspeed = elm.sliderspeed;

        // How much to degrade
        var degradation = 50;

        // Calculate new speed
        var newspeed = cursliderspeed - (degradation * elm.numpics);

        // Calculate newspeed
        if(newspeed < elm.minpicinitspeed) {

            newspeed = elm.minpicinitspeed;
            degradation = (cursliderspeed  - newspeed) / elm.numpics;

        }

        // Rotate to picture
        function rotatetopicture(timestamp) {

            // Grab first element
            var first = elm.find('.pic-div').eq(0);

            // Find id
            var id = first.attr('id');

            // Find the timestamp
            var fts = parseInt(id.split('-').pop(), 10);

            // Recurse call 
            if(timestamp !== fts) {

                // Slow down a bit
                elm.sliderspeed += degradation;

                // Move carousel forward
                elm.moveforward(

                    // Call myself again
                    function(didr) {

                        if(!didr) { 
                            debuglog('did not rotate?');
                        }
                        else { 
                            rotatetopicture(timestamp); 
                        }

                    }, 
                    isdel
                );

            }

            // Reset slider-speed to default
            else {
                elm.sliderspeed = cursliderspeed;
                elm.addremove = false;

                // Cancel load handler
                if(callback) callback(true, isfirst, timestamp);
            }
        }

        // Rotate to new picture 
        if(initadd == false && rotate) {

            // Torque slider speed up
            elm.sliderspeed = elm.minpicinitspeed;

            // Wait for image to load
            var $img = $dv.find('img');
            $img.on('load.rotate', function(e) {
                $img.off('load.rotate');
                rotatetopicture(pinfo.timestamp);
            });
        }
        else {

            // Unset addremove
            elm.addremove = false;

            // Invoke callback with 'true' & the display timetamp
            if(initadd == false && callback) {
                callback(true, isfirst, pinfo.timestamp);
            }
        }

        // Add the keyphoto class
        if(makekey == true)
        {
            // There shouldn't be another
            var lastkey = elm.find('.key-picture');

            // Print an error message
            if(lastkey && lastkey.length > 0) {
                debuglog('Severe error: multiple key-pictures!');
                lastkey.removeClass('key-picture');
            }
            
            // Add this class
            $dv.addClass('key-picture');
        }
    }

    // Make a new key picture
    elm.makekeypicture = function(callback) {

        // Return immediately if animating
        if(elm.animating) {
            if(callback) callback(false);
            return false;
        }

        // Get a list of the $div elements.
        var $dv = elm.find('.pic-div');

        // Return if the length is less than 1
        if($dv.length < 1) {
            if(callback) callback(false);
            return false;
        }

        // Grab the last key picture
        var lastkey = elm.find('.key-picture');

        // Remove the key-picture class 
        if(lastkey) {
            lastkey.removeClass('key-picture');
        }

        // Get the current display element
        var $cur = $dv.eq(0);

        // Add the key-picture class
        $cur.addClass('key-picture');

        elm.showkey(elm);

        // Run the callback if its there
        if(callback) {
            callback(true, $cur[0].pinfo);
        }

        return true;
    }

    // Move left
    elm.moveforward = function(callback, isdel) {

        // Don't clone if we're deleteing
        isdel = (isdel ? isdel : false);

        // Return immediately if already animating
        if(elm.animating) {
            if(callback) callback(false);
            return false;
        }

        // Get a list of the $div elements
        var $dv = elm.find('.pic-div');

        // Return if there's less than two pictures
        if($dv.length <= 1) {

            // Add picture case
            elm.modkey = false;

            // Callback 
            if(callback) callback(false);

            return false;
        }

        // Get the current display element
        var $cur = $dv.eq(0);

        // Next element
        var $next;
        
        $next = $dv.eq(1);

        // Set the animating flag
        elm.animating = true;

        // Set the left attribute
        $next.css('left', elm.maxwidth + 'px');

        // Place in the center
        var topheight = Math.floor(
                (elm.maxheight -  $next[0].pinfo.height) / 2);

        // Set top margin
        $next.css('margin-top', topheight + 'px');

        // Don't clone if were deleting
        if(isdel == false) {

            // Clone the current to the end of the list
            var $cln = $cur.clone(true);

            // Copy pinfo
            $cln[0].pinfo = $cur[0].pinfo;

            // Move out of sight
            $cln.css('left', '-10000px');

            // Append to viewport
            $cln.appendTo(elm.viewport);
        }

        // Set the modkey flag
        elm.modkey = true;

        // Make the key invisible
        elm.hidekey(elm);

        // Counter to set the animating flag
        var count = 0;

        // Animate current
        $cur.stop().animate( 
                { left : '-=' + elm.maxwidth + 'px'},
                elm.sliderspeed, 
                elm.easing, 
                function() { 

                    if(++count == 2) { 

                        // Remove dup pic
                        $cur.remove(); 

                        // Show key if it's set
                        if($next.hasClass('key-picture')) {
                            elm.showkey(elm);
                        }
                        else {
                            elm.hidekey(elm);
                        }

                        // Set the visible element
                        elm.$currentpic = $next;

                        // No longer animating
                        elm.animating = false; 

                        // Don't block mouseovers
                        elm.modkey = false;

                        // Invoke callback
                        if(callback) callback(true);
                    } 
                } 
        );

        // Animate next
        $next.stop().animate(
                { left : '-=' + elm.maxwidth + 'px' },
                elm.sliderspeed, 
                elm.easing,
                function() { 

                    if(++count == 2) { 

                        $cur.remove(); 

                        // Show key if it's set
                        if($next.hasClass('key-picture')) {
                            elm.showkey(elm);
                        }
                        else {
                            elm.hidekey(elm);
                        }

                        // Set the visible element
                        elm.$currentpic = $next;

                        // No longer animating
                        elm.animating = false; 

                        // Don't block mouseovers
                        elm.modkey = false;

                        // Invoke callback
                        if(callback) callback(true);
                    } 
                }
        );

        return true;
    }

    // Move right
    elm.movebackward = function(callback) {

        // Return immediately if already animating
        if(elm.animating) {
            if(callback) callback(false);
            return false;
        }

        // Get a list of the $dv elements
        var $dv = elm.find('.pic-div');

        // Return if there's less than two pictures
        if($dv.length <= 1) {

            // Add picture case 
            elm.modkey = false;

            // Invoke callback
            if(callback) callback(false);

            return false;
        }

        // Counter to set the animating flag
        var count = 0;

        // Set the animating flag
        elm.animating = true;

        // Get the current display element
        var $cur = $dv.eq(0);

        // Get the prev element
        var $pv = $dv.eq(-1);

        // Clone the last item
        var $next = $pv.clone(true);

        // Copy pinfo
        $next[0].pinfo = $pv[0].pinfo;

        // Set its width
        $next.css('left', '-' + elm.maxwidth + 'px');

        // Place in the center
        var topheight = Math.floor(
                (elm.maxheight -  $next[0].pinfo.height) / 2);

        // Set top margin
        $next.css('margin-top', topheight + 'px');

        // Insert it before the first item
        $next.insertBefore($cur);

        // Make the key invisible
        elm.hidekey(elm);

        // Animate current
        $cur.stop().animate(

            { left : '+=' + elm.maxwidth + 'px' },
            elm.sliderspeed,
            elm.easing,
            function() { 
                // Move off stage
                $cur.css('left', '-10000px'); 

                // We finished last
                if(++count == 2) { 

                    // Remove dup pic
                    $dv.last().remove();

                    // Show key if its set
                    if($next.hasClass('key-picture')) {
                        elm.showkey(elm);
                    }
                    else {
                        elm.hidekey(elm);
                    }

                    // Set the visible element
                    elm.$currentpic = $next;

                    // No longer animating
                    elm.animating = false;

                    // Don't block mouseovers
                    elm.modkey = false;

                    // Callback
                    if(callback) callback(true);
                }
            }
        );

        // Animate next
        $next.stop().animate(

            { left : '+=' + elm.maxwidth + 'px' },
            elm.sliderspeed,
            elm.easing,
            function() { 

                // We finished last
                if(++count == 2) { 

                    // Remove dup pic
                    $dv.last().remove();

                    // Show key if its set
                    if($next.hasClass('key-picture')) {
                        elm.showkey(elm);
                    }
                    else {
                        elm.hidekey(elm);
                    }

                    // Set the visible element
                    elm.$currentpic = $next;

                    // Don't block mouseovers
                    elm.modkey = false;

                    // No longer animating
                    elm.animating = false; 

                    // Callback
                    if(callback) callback(true);
                } 
            }
        );
        return true;
    }

    // Stop rotating carousel
    elm.stoprotate = function() {

        // Clear the timer
        clearTimeout(elm.rotatetimer);

        // Set rotating boolean to false
        elm.rotating = false;
    }

    // Internal rotate function
    rotatefunc = function() {

        if(elm.rotating == false) {
            return;
        }

        // Tell the carousel to move forward
        elm.moveforward(function(moved) {

            // Set timeout after animation
            elm.rotatetimer = setTimeout(rotatefunc, 
                elm.rotateinterval);

        });
    }

    // Run a callback when the first picture is loaded
    elm.loadcarousel = function(callback) {

        // Get a list of the $dv elements
        var $dv = elm.find('.pic-div');

        // Callback immediately if there are no pictures
        if(!$dv || $dv.length <= 0) {

            // Invoke the callback function
            callback($dv.length);

            // Nothing else to do
            return;
        }

        // Get the current display element
        var $cur = $dv.eq(0);

        var $img = $dv.find('img');

        // Find the first and only picture
        $img.on('load.first', function() {

            // Cancel event trigger
            $img.off('load.first');

            // It's loaded, so callback
            callback($dv.length);
        });
            
        // Add this picture
        var ii = elm.startindex;

        // Count of pictures added
        var cnt = 0;

        // Iterate over count
        for(cnt = 0 ; cnt < picinfo.length - 1; cnt++) {

            // Add this picture now
            elm.addpicture(picinfo[ii], true);

            // Go to next picture
            ii = (ii + 1) % picinfo.length;
        }

        // Place in the center
        var topheight = Math.floor(
                (elm.maxheight -  $dv[0].pinfo.height) / 2);

        // Set top margin
        $dv.css('margin-top', topheight + 'px');
    }

    // Start rotating carousel
    elm.startrotate = function() {

        // Return immediately if we're already rotating
        if(elm.rotating == true) {
            debuglog("carousel is already rotating.");
            return;
        }

        // We are now rotating
        elm.rotating = true;

        // Set the timer to true
        elm.rotatetimer = setTimeout(rotatefunc, elm.rotateinterval);

    }

    // Enable keydown navigate
    elm.enablekeydown = function() {

        // Event handler for keydown
        $(document).on("keydown.carousel", function(e) {
            var code = (e.keyCode ? e.keyCode : e.which);
            switch(code) {
                case 39:
                    elm.moveforward();
                    return false;
                    break;
                case 37:
                    elm.movebackward();
                    return false;
                    break;
            }
        });
    }

    // Disable keydown navigate
    elm.disablekeydown = function() {
        $(document).off("keydown.carousel");
    }

    // Stop everything
    elm.destroy = function() {

        // Stop rotating
        if(elm.rotating) {

            // Clear this timeout
            elm.stoprotate();
        }

        elm.disablekeydown();

        // Destroy arrows
        // Destroy key
    }

    // Create key picture object
    createkey(elm);

    // Display nomeal picture if picinfo is empty
    if(!picinfo || picinfo.length <= 0) {

        // Show the nomeal picture
        elm.nomeal(elm);


    }
    // Populate carousel
    else {
        // Add this picture
        var ii = 0;

        // Count of pictures added
        var cnt = 0;

        // The makekey photo variable
        var makekey = false;

        // Find start index
        if(keytimestamp) {

            // Use registered search function
            ii = elm.findpicix(picinfo, keytimestamp);

            // Couldn't find key photo
            if(ii < 0) ii = 0;

            // Make this a key photo if we found it
            else makekey = true;
        }

        // Add this picture now
        elm.addpicture(picinfo[ii], true, makekey);

        // Set startindex to the next picture
        elm.startindex = ii = (ii + 1) % picinfo.length;
    }

    // Enable arrow scrolling
    elm.enablekeydown();

    // Return the elm carousel object
    return elm;
}
