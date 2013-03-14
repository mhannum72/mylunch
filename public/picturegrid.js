// The picture grid
var picturegrid = (function ($jq) {

    // Cache jquery
    var $ = $jq;

    // Previous page
    var gridprevpage;

    // Next page
    var gridnextpage;

    // Where this will appear on the page
    var parentdiv;

    // Name of the user
    var username;

    // What's the left margin
    var marginleft;

    // What's the right margin
    var marginright;

    // What's the top margin
    var margintop;

    // What's the picture border
    var picborder;

    // What's the bottom margin
    var marginbottom;

    // Container margin top
    var containermargintop;

    // Container margin bottom
    var containermarginbottom;

    // Container margin right
    var containermarginright;

    // Container margin left
    var containermarginleft;

    // What's the width of a picture
    var picturewidth;

    // What's the heigth of a picture
    var pictureheight;

    // What's the height of the picture footer
    var footerheight;

    // What's the font size in the footer
    var footerfontsize;

    // Number of pictures font size
    var subfooterfontsize;

    // What's the space between the picture and footer
    var footerspace;

    // How many pictures per row
    var mealsperrow;

    // How many rows per page
    var rowsperpage;

    // Derived: how many meals per grid
    var mealspergrid;

    // Derived: how many pixels wide?
    var gridwidth;

    // Allow 
    var nxpvcallback;

    // Easing function
    var grideasing;

    // Speed to change pages
    var gridspeed;

    // Viewport width leaves a little breathing room at the edges
    var viewportwidth;

    // Some fudge for stripe text
    var stripefudge;

    // Set the anchor click function
    var anchorclickfn;

    // cache the last mealinfo array
    var lastmealinfo;

    // New meal anchor
    //var newmealanchor;

    // Use hover text
    var usehovertext;

    // Calculate the container grid height
    var containerheight;

    // Calculate the outer container grid height
    var outercontainerheight;

    // Calculate the outer container grid width
    var outercontainerwidth;

    // Calculate the outercontainer margin top
    var outercontainermargintop;

    // Calculate the outercontainer margin bottom
    var outercontainermarginbottom;

    // Calculate the outercontainer margin left
    var outercontainermarginleft;

    // Calculate the outercontainer margin right
    var outercontainermarginright;

    // Keep track of what's currently displayed
    var currentgrid;

    // How to locate a picindex
    var findpicidx;

    // Viewport for grid
    var gridviewport;

    // Container for grid
    var gridcontainer;

    // Outer-container for grid
    var gridoutercontainer;

    // Maintain the height of viewport
    var viewportheight;

    // Set to true if we're displaying
    var displaying;

    // Set to true to display picture count trace
    var picturecounttrace;

    // Set to true to display time trace
    var picturetimetrace;

    // Set to true to display slashed date format
    var slasheddate;

    // Set to the footer alignment
    var footeralign;

    // Set to true to display picture title
    var titletrace;

    // Font color of the title
    var titlefontcolor;

    // Set to true to animate grid pages
    var animatenextprev;

    // I can either delete a meal in place or redraw the grid
    var deletebehavior;

    // A callback that returns true if the modal is up, false otherwise
    var modalisup;

    // Create element wrapper
    var dc = function(a)
    {
        return document.createElement(a);
    }

    // Return the number of meals per grid
    function mealcount() {

        return mealspergrid;

    }

    function modalisshowing() {

        if(modalisup) {
            return modalisup();
        }

        return false;
    }

    // Create a new meal via an ajax request & then show it's attributes
    function newmealpopup() {

        if(modalisshowing()) {
            return false;
        }

        $.getJSON(
            '/newmeal',
            {
                username: username
            },
            function(response) {
                if(response.message == undefined || response.message != "success") {
                    if("baduser" == response.message) {
                        window.location.replace("/signin");
                    }
                    else {
                        //console.log("Response error is ", response.message);
                        window.location.replace("/");
                    }
                    return;
                }
    
                // Create a new grid
                drawnextmeals( 
                    new mealpage(parseInt(response.timestamp,10)),
                    showattributes.setgridobj
                );

                // Display a popup
                showattributes.show(username, response.timestamp);
            
            }
        );
    }

    // Return the number of meals per grid
    function mealcount() {

        return mealspergrid;

    }

    // Set the newmeal anchor
    function setnewmealanchor(anchor) {

        //newmealanchor = anchor;

        // Invoke the popup handler if it's clicked
        $(anchor).click(function() {
            newmealpopup();
        });

    }

    // Updates title displayed on the grid
    function updatetitle(meal) {

        if(titletrace) {

            // Grab the gridobj
            if(!meal.gridobj) meal.gridobj = showattributes.getgridobj();

            // Paragraph object
            var titlesp = $(meal.gridobj).find('.titlespan'); 

            // Format title string
            var title = titlestring(meal);

            // Special case no-title
            if (title.length <= 0) {
    
                titlesp.css('color', '#fff');
                title = ".";
            }
            else {
                titlesp.css('color', titlefontcolor);
            }
    
            // Set the html
            titlesp.html(title);
        }
    }

    // Updates hover meal text displayed on the grid
    function updatemeal(meal) {

        // Grab the gridobj
        if(!meal.gridobj) meal.gridobj = showattributes.getgridobj();
        
        // Capitalize
        var mealtxt = meal.meal.charAt(0).toUpperCase() + meal.meal.slice(1);

        // Complete text
        var hovertxt = mealtxt + " created on " + 
            new Date(meal.timestamp).asMyString();

        // Div object
        var div = $(meal.gridobj).find('div > center > div > a');

        // Set the title
        if(div) div.attr('title', hovertxt);
    }

    // Updates picture count displayed on the grid
    function updatepicturecount(meal) {

        if(picturecounttrace) {

            // Grab the gridobj
            if(!meal.gridobj) meal.gridobj = showattributes.getgridobj();

            // Grid object
            var paragraph = $(meal.gridobj).find('.pcountspan'); 

            // Update string
            var picturecountstring = pcountstring(meal);
                //meal.picInfo.length + " pictures";

            // Set the html
            paragraph.html(picturecountstring);

        }
    }

    // Request previous pages meals from the server
    function drawprevmeals(prevpage) {

        $.getJSON('/editpageprev',
        {
            username: username,
            prevts: prevpage.timestamp,
            count: mealspergrid
        },
        function(response) {
            if(response.errStr != undefined && response.errStr.length > 0) {

                // Send this error to a space at the top..
                //console.log('editpageprev error: ' + response.errStr);
            }
            else {
                var nextpage = new mealpage(parseInt(response.nextts,10));
                var prevpage = new mealpage(parseInt(response.prevts,10));

                displaygrid(response.mealinfo, prevpage, nextpage, 'backwards');
            }
        });
        return 0;
    }

    // Request the next page of meals
    function drawnextmeals(nextpage, callback) {
    
        // Make this an ajax request that will return enough information
        $.getJSON('/editpagenext',
            {
                username: username,
                nextts: nextpage.timestamp,
                count: mealspergrid
            },
            function(response) {
                if(response.errStr != undefined && response.errStr.length > 0) {
                    // Send this error to a space at the top..
                    //console.log('editpagenext error: ' + response.errStr);
                }
                else {
                    var nextpage = new mealpage(
                        parseInt(response.nextts,10) 
                    );
                    var prevpage = new mealpage(
                        parseInt(response.prevts,10)
                    );
                    displaygrid(response.mealinfo, prevpage, nextpage, 'forwards', callback);
                }
            }
        );
        return 0;
    }
    
    // Create div & link for a next or prev page
    function nextprevlnk(page, drawmeals) {

        // Create click anchor
        var anchor = $(dc('a'))
            .attr('href', 'javascript:void(0)');

        // Invoke the callback if clicked
        anchor.click(function() {
            drawmeals(page);
        });

        // Return the anchor
        return anchor;
    } 

    // Set up the links for the next and previous page
    function nextprevpagelinks(nextpage, prevpage) {
    
        // Pointer to possible prevanchor
        var prevanchor;

        // Pointer to possible nextanchor
        var nextanchor;

        // Set object nextpage
        gridnextpage = nextpage;

        // Set object prevpage
        gridprevpage = prevpage;

        // Normalize nextpage argument
        nextpage = nextpage && nextpage.timestamp > 0 ? nextpage : null;

        // Normalize prevpage argument
        prevpage = prevpage && prevpage.timestamp > 0 ? prevpage : null;
    
        // Prevpage div
        if(prevpage) {

            // Create a prev anchor
            var prevanchor = nextprevlnk(prevpage, drawprevmeals);

        }
    
        // Nextpage div
        if(nextpage) {

            // Create a next div
            var nextanchor = nextprevlnk(nextpage, drawnextmeals);

        }

        // Update globals
        if(nxpvcallback) {

            // Call the nextprev callback
            nxpvcallback(prevpage, nextpage, prevanchor, nextanchor);

        }
    }

   // Updates the grid display picture to this timestamp
    function updatedisplaypicture(meal, picinfo) {

        // Get the gridobj
        if(!meal.gridobj) meal.gridobj = showattributes.getgridobj();

        // Jquery-ize
        var griddiv = $(meal.gridobj);

        // Get the image element
        var gridpic = griddiv.find('div > center > div > a > img');

        // Init thumb height
        var thumbheight = 0;

        // New source for key timestamp
        var imgsrc;

        // Pulling from picinfo
        if(picinfo) {

            thumbheight = picinfo.thumbheight;
            imgsrc = '/thumbs/' + meal.username + '/' + picinfo.timestamp;

        }
        // Show the nomeal picture
        else {
            thumbheight = NOMEALHEIGHT;
            imgsrc = '/images/nomeal.png';
        }

        // Error checking
        //if(thumbheight <= 0) {
            //console.log("ERROR!  Thumbheight is an invalid value: " + 
            //        thumbheight);
        //}

        // Set image source
        gridpic.attr('src', imgsrc);

        // Set correct height and margin
        griddiv.css('height', (thumbheight + (2 * picborder)) + 'px')
            .css('margin-top', (pictureheight - thumbheight) + 'px');

        // Update keytimestamp in meal object
        if(picinfo) {
            meal.keytimestamp = picinfo.timestamp;
        }
        else {
            meal.keytimestamp = 0;
        }
    }

    // Return the height of the key-pic, the first pic, or no-meal
    function calculatethumbheight(meal) {

        var thumbheight;

        // Find the key pic in the picInfo array
        if(meal.keytimestamp) {

            var idx = findpicidx(meal.picInfo, meal.keytimestamp);

            if(idx >= 0) thumbheight = meal.picInfo[idx].thumbheight;
        }

        // Otherwise use the first picture
        else if(meal.picInfo && meal.picInfo.length > 0) {

            thumbheight = meal.picInfo[0].thumbheight;
        }

        // Height of the nomeal picture
        else {
            thumbheight = NOMEALHEIGHT;
        }

        return thumbheight;
    }

    // Return the title string
    function titlestring(meal) {
        var tstring;

        if(meal.title != undefined && meal.title.length > 0) {
            tstring = meal.title;
        }
        else {
            tstring = "";
        }

        return tstring;
    }

    // Return a paragraph object with the correct title
    function titlespan(meal) {

        // Grab title string
        var tstring = titlestring(meal);

        // Create paragraph with this as the html
        var span = $(dc('span'))
                .attr('class', 'titlespan')
                .css('font-size', footerfontsize + 'px')
                .css('border', 'none');

        // Special case no-title
        if (tstring.length <= 0) {

            span.css('color', '#fff');
            tstring = ".";
        }
        else {
            span.css('color', titlefontcolor);
        }

        // Set the title string
        span.html(tstring);

        // Return it
        return span;
    }


    // Return a sub-footer paragraph object
    function subfooterp(meal) {
        var par = $(dc('p'))
            .attr('class', 'subfooterp')
            .css('text-align', footeralign)
            .css('line-height', (subfooterfontsize - 10) + 'px')
            .css('font-size', subfooterfontsize + 'px')
            .css('border', 'none');

        // Return it
        return par;
    }

    // Return the picture time string
    function ptimestring(meal, both) {

        // Dateify the meal timestamp
        var datest;
        
        // Use slashdate format
        if(slasheddate) {
            datest = new Date(meal.timestamp).asSlashString();
        }

        // Use normal format
        else {
            datest = new Date(meal.timestamp).asMyString();
        }

        // Return it
        return datest;

    }

    // Return a span object with the picture timestamp
    function ptimep(meal, both) {

        // Grab picture time string
        var ptime = ptimestring(meal, both);

        // Create span with this as the html
        var par = $(dc('p'))
            .attr('class', 'ptimep')
            .css('color', '#777')
            .css('text-align', footeralign)
            .css('line-height', (subfooterfontsize - 10) + 'px')
            .css('font-size', subfooterfontsize + 'px')
            .css('border', 'none')
            .html(ptime);

        // Return it
        return par;
    }

    // Return the picture count string
    function pcountstring(meal) {

        var picturecountstring;

        // 0 is plural in english
        if(!meal.picInfo || meal.picInfo.length == 0) {
            picturecountstring = "0 pictures";
        }
        // 1 is singular
        else if(meal.picInfo.length == 1) {
            picturecountstring = "1 picture";
        }
        // Everything else is plural
        else {
            picturecountstring = meal.picInfo.length + " pictures";
        }

        return picturecountstring;
    }

    // Return a span object with the correct pcount string
    function pcountp(meal) {

        // Grab picture count string
        var pcount = pcountstring(meal);

        // Create span with this as the html
        var par = $(dc('p'))
            .attr('class', 'pcountp')
            .css('color', '#777')
            .css('text-align', footeralign)
            .css('line-height', 0 + 'px')
            .css('font-size', subfooterfontsize + 'px')
            .css('border', 'none')
            .html(pcount);

        // Return it
        return par;
    }

    // The internal grid object contains the click logic
    function pdivint(meal, editgrid) {

        // Thumb height
        var thumbheight = calculatethumbheight(meal);

        // I can manipulate this directly in the delete code.
        var editInternal = $(dc('div'))
            .css('class', 'internalmargin')
            .css('margin-top', picborder + 'px')
            .css('float', 'top');
    
        // Center tag
        var center = $(dc('center'));

        // Append to internal-div
        center.appendTo(editInternal);
    
        // Image div
        var editImageDiv = $(dc('div'));
    
        // Append to center
        editImageDiv.appendTo(center);

        // Create an anchor with this text
        var anchor = $(dc('a'))
            .attr('href', 'javascript:void(0)');

        // Use a callback to set the anchor's target
        if(anchorclickfn) {
            anchor.click(function() {
                anchorclickfn(meal.username, meal.timestamp, editgrid);
            });
        }

        // Add hover text if we want it 
        if(usehovertext) {

            // Uppercase first letter of the meal
            var mealtxt = meal.meal.charAt(0).toUpperCase() + meal.meal.slice(1);
    
            // Format hover string
            var hovertxt = mealtxt + " created on " + 
                new Date(meal.timestamp).asMyString();
    
            // Set the hover text
            anchor.attr('title', hovertxt);
        }

        // Append to the image div
        anchor.appendTo(editImageDiv);
    
        // Text containing the image source
        var imgsource;
    
        // Default nomeal
        if(!meal.picInfo || meal.picInfo.length <= 0) {
            imgsource = '/images/nomeal.png';
        }

        // Use the key picture
        else if (meal.keytimestamp) {
            imgsource = '/thumbs/' + meal.username + '/' + meal.keytimestamp;
        }

        // Use the first picture
        else{
            imgsource = '/thumbs/' + meal.username + '/' + meal.picInfo[0].timestamp;
        }
    
        // Image teag
        var image = $(dc('img'))
            .attr('class', 'gridimage')
            .attr('src', imgsource);

        // Append to my anchor
        image.appendTo(anchor);

        // Return the newly created object 
        return editInternal;
    }

    // Create an inner (attributed) pdiv object
    function pdivinner(meal) {
    
        // Calculate the thumb height here
        var thumbheight = calculatethumbheight(meal);

        // Create the editgrid div
        var editgrid = $(dc('div'))
            .attr('class', 'editgridbg')
            .css('border-top', '1px solid')
            .css('border-left', '1px solid')
            .css('border-right', '1px solid')
            .css('border-color', '#ddd') // same as the background color
            .css('background-color', '#fff')
            .css('position', 'relative')
            .css('margin-top', (pictureheight - thumbheight) + 'px')
            .css('float','top')
            .css('box-shadow', '3px 3px 5px #444')
            .css('-webkit-box-shadow', '3px 3px 5px #444')
            .css('-moz-box-shadow', '3px 3px 5px #444')
            .css('width', picturewidth + (2 * picborder) + 'px')
            .css('height', (thumbheight + (2 * picborder)) + 'px');

        // Create the footer
        var footer = $(dc('div'))
            .attr('class', 'editgridfooter')
            .css('background-color', '#fff')
            .css('box-shadow', '3px 3px 5px #444')
            .css('-webkit-box-shadow', '3px 3px 5px #444')
            .css('-moz-box-shadow', '3px 3px 5px #444')
            .css('border-left', '1px solid')
            .css('border-right', '1px solid')
            .css('border-bottom', '1px solid')
            .css('border-color', '#ddd')
            .css('position', 'absolute')
            .css('bottom', '-' + (footerheight + footerspace) + 'px')
            .css('left', '-1px')
            .css('clear', 'both')
            .css('width', picturewidth + (2 * picborder) + 'px')
            .css('height', footerheight)
            .css('font-size', footerfontsize + 'px')
            .css('color', '#333')
            .css('line-height', (footerfontsize + 15) + 'px')
            .css('text-align', footeralign)
            .css('text-indent', '10px');

        // Append a title
        if (titletrace) {

            // Create a title paragraph object
            var titlesp = titlespan(meal);

            // Append to the footer
            titlesp.appendTo(footer);

        }

        // Variable to hold subfooter paragraph if we need one
        var sfoot = null;

        // Append a time
        if (picturetimetrace) {

            // Create a time-trace span
            var ptimesp = ptimep(meal, picturecounttrace);

            // Append to the footer
            ptimesp.appendTo(footer);

        }

        // Append a picture count
        if (picturecounttrace) {

            // Create a pcount paragraph object
            var pcountsp = pcountp(meal);
    
            // Append to the footer
            pcountsp.appendTo(footer);
    
        }

        // I can switch the internal div in the delete code
        var intn = pdivint(meal, editgrid);
    
        // Append this to the edit grid
        intn.appendTo(editgrid);

        // Append the footer
        footer.appendTo(editgrid);

        // Return grid
        return editgrid;
    }

    // Create a pdiv
    function pdiv(meal) {

        // Create an outer shell container 
        var egcontainer = $(dc('li'))
            .attr('class', 'egcontainer')
            .css('float', 'left')
            .css('float', 'bottom')
            .css('position', 'relative')
            .css('width', picturewidth + (2 * picborder) + 'px')
            .css('height', (pictureheight + footerheight + picborder) + 'px')
            .css('margin-top', margintop + 'px')
            .css('margin-bottom', marginbottom + 'px')
            .css('margin-left', marginleft + 'px')
            .css('margin-right', marginright + 'px')
            .css('display', '-moz-inline-stack')
            .css('display', 'inline-block')[0];

        // Create the grid components
        var editgrid = pdivinner(meal);

        // Append my editgrid (with size info) to the container
        editgrid.appendTo(egcontainer);

        // Direct lookup for editgrid
        egcontainer.editgrid = editgrid[0];
    
        // Return the top-level object
        return egcontainer;
    }

    // Append picture to the end of the grid
    function addmealtogrid(griddiv, gridpic, loadcb) {

        var hdiv = null;

        // Return false if we're filled up
        if(griddiv.count >= mealspergrid) {
            return false;
        }

        // Create the ul if this is the first
        if(griddiv.count == 0) {

            // Create unordered list
            var $ul = $(dc('ul'))
                .css('width', gridwidth + 'px')
                .css('height', containerheight + 'px')
                .css('float', 'left');

            // Append to the grid
            $ul.appendTo(griddiv);

            // Keep a reference
            griddiv.ulist = $ul[0];

        }

        // Update last picture
        if(griddiv.lastg) {

            // Current last's 'next' will point to this
            griddiv.lastg.nextg = gridpic;

            // This prev will be the current last
            gridpic.prevg = griddiv.lastg;
        }
        else {
            gridpic.prevg = null;
        }

        // Nothing after
        gridpic.nextg = null;

        // This is the new last
        griddiv.lastg = gridpic;

        // It's also the first if there is none
        if(!griddiv.firstg) {

            // Make this the first picture
            griddiv.firstg = gridpic;
        }

        // Append to the ul
        $(gridpic).appendTo(griddiv.ulist);

        // Increment count
        griddiv.count++;

        // Invoke 'pic-is-loaded' callback
        if(loadcb) {
            var image = $(gridpic).find('.gridimage');
            image.on('load.picdivinternal', function() {
                image.off('load.picdivinternal');
                loadcb(griddiv);
            });
        }

        return true;
    }

    // Redraw the grid when I delete a meal
    function dmealredraw(meal, callback) {

        var editgrid;

        var newmealinfo = false;

        var nmealtime = 0;

        var pmealtime = 0;

        var reqcount = 1;

        var newgrid = false;

        // Get the gridobj
        if(!meal.gridobj) meal.gridobj = showattributes.getgridobj();

        // Grab gridobj directly - i think this can only be gridobj
        editgrid = $(meal.gridobj).parent()[0];

        // If there's a next page..
        if(gridnextpage) {
            // ..ask for a single meal
            nmealtime = gridnextpage.timestamp;
        }

        // If this is the last picture and there is a previous picture
        if(currentgrid.firstg == currentgrid.lastg && gridprevpage) {

            // Send the previous page timestamp
            pmealtime = gridprevpage.timestamp;

            // Request this many 
            reqcount = mealspergrid;

            // This is a newgrid request
            newgrid = true;
        }

        // Ask server to delete the meal
        $.getJSON('/deletemeal',
            {
                username: meal.username,
                timestamp: meal.timestamp,
                nextts: nmealtime,
                prevts: pmealtime,
                count: reqcount
            },
            function(response) {
                if(response.errStr != undefined && response.errStr.length > 0) {
                    if(response.errStr == "signin") {
                        window.location.replace("/signin");
                    }
                    else {
                        //console.log("getJSON response error is ", response.errStr);
                        window.location.replace("/");
                    }
                    return;
                }

                // Create a new nextpage
                var nextpage = new mealpage(parseInt(response.nextts,10));

                if(newgrid) {

                    // Create a new prevpage
                    var prevpage = new mealpage(parseInt(response.prevts,10));



                    // Redraw the grid
                    displaygrid(response.mealinfo, prevpage, nextpage, 'forwards');
                }

                else {

                    // Find the index of the deleted picture
                    var idx = findpicidx(lastmealinfo, meal.timestamp);

                    if(idx < 0) {
                        //console.log("Error - deleted picture is not in lastmealinfo.");
                    }
                    else {
                        // Remove this picture
                        lastmealinfo.splice(idx, 1);

                        if(response.mealinfo.length >= 1) {

                            lastmealinfo.push(response.mealinfo[0]);

                        }

                        // Display
                        displaygrid(lastmealinfo, gridprevpage, nextpage, 'backwards');
                    }

                }

                if(callback) callback();
            }
        );
    }

    // Delete a meal from the grid
    function dmealreplace(meal, callback) {

        var editgrid;

        // Get the gridobj
        if(!meal.gridobj) meal.gridobj = showattributes.getgridobj();

        // Grab gridobj directly - i think this can only be gridobj
        editgrid = $(meal.gridobj).parent()[0];

        // Grab a pointer to the first
        var firstgrid = currentgrid.firstg;

        // Grab a pointer to the last
        var lastgrid = currentgrid.lastg;
        
        // How many pictures to request from the server
        var reqcount = 1;

        // Set to redraw entire grid
        var redraw = false;

        // Next-meal request variable
        var nmealtime = 0;

        // Prev-meal request variable
        var pmealtime = 0;

        // Last remaining picture on the grid
        if(firstgrid == lastgrid) {

            // We'll want to redraw the previous page
            redraw = true;

            // Ask the server for the previous page
            if(gridprevpage) {

                // Grab prevmeal timestamp
                pmealtime = gridprevpage.timestamp;

                // Ask for an entire grid
                reqcount = mealspergrid;
            }
        }

        // If there's a next page..
        else if(gridnextpage) {
            // ..ask for a single meal
            nmealtime = gridnextpage.timestamp;
        }

        // Get pointer to next
        var nextgrid = editgrid.nextg;

        // Remove meal
        $(editgrid.editgrid).remove();

        // Walk gridpics, copying each into the last
        while(nextgrid) {

            // Repoint me to next
            editgrid.editgrid = nextgrid.editgrid;

            // Jquery wrapper for internal
            var $igrid = $(nextgrid.editgrid);

            // Detach from nextgrid
            $igrid.detach();

            // Reattach to currentgrid
            $igrid.appendTo(editgrid);

            // Set editgrid to nextgrid
            editgrid = nextgrid;

            // Set nextgrid to nextgrid.next
            nextgrid = editgrid.nextg;
        }

        // Zap internals- this may be filled above
        editgrid.editgrid = null;

        /* 
         * This request has two flavors.  If prevts is set at all, the
         * backend assumes that this is the last picture on the page,
         * and sends the information for the previous page.  If it is
         * 0, then this is a normal delete.
         */

        // Ask server to delete the meal
        $.getJSON('/deletemeal',
            {
                username: meal.username,
                timestamp: meal.timestamp,
                nextts: nmealtime,
                prevts: pmealtime,
                count: reqcount
            },
            function(response) {
                if(response.errStr != undefined && response.errStr.length > 0) {
                    if(response.errStr == "signin") {
                        window.location.replace("/signin");
                    }
                    else {
                        //console.log("getJSON response error is ", response.errStr);
                        window.location.replace("/");
                    }
                    return;
                }

                // Create a new prevpage
                var prevpage = new mealpage(parseInt(response.prevts,10));

                // Create a new nextpage
                var nextpage = new mealpage(parseInt(response.nextts,10));

                // Redraw the grid
                if(redraw) {

                    displaygrid(response.mealinfo, prevpage, nextpage, 'backwards');

                }

                // Normal case
                else {

                    // Update nextpage with the server response
                    gridnextpage = nextpage;

                    // Found a new last meal
                    if(response.mealinfo && response.mealinfo.length >= 1) {

                        // Create a pdiv
                        var $newpic = $(pdivinner(response.mealinfo[0]));

                        // Switch out internals
                        lastgrid.editgrid = $newpic[0];

                        // Append
                        $newpic.appendTo(lastgrid);

                        // Grab the image tag
                        var image = $newpic.find('.gridimage');

                        // Wait for this to load
                        image.on('load.deletepic', function() {

                            // Cancel event trigger
                            image.off('load.deletepic');

                            // Set up next and prev page links
                            nextprevpagelinks(nextpage, prevpage);
                        });
                    }

                    // Delete last grid object
                    else {

                        // Get a pointer to the previous
                        var prev = lastgrid.prevg;

                        // Cut out of the linked list
                        prev.nextg = null;

                        // Update the lastgrid
                        currentgrid.lastg = prev;

                        // Might have to delete stripe
                        if(prev.stripe != lastgrid.stripe) {

                            // New last stripe
                            currentgrid.laststripe = prev.stripe;

                            // Nullify next
                            currentgrid.laststripe.nextst = null;

                            // Remove the lastgrid stripe
                            lastgrid.stripe.remove();
                            
                        }

                        // Remove the grid
                        else {

                            // Remove the lastgrid
                            $(lastgrid).remove();

                            // If there's a spacer, remove it 
                            if(lastgrid.spacer)
                                $(lastgrid.spacer).remove();

                        }

                        // Decrement count
                        currentgrid.count--;

                        // Set next and prev links
                        nextprevpagelinks(nextpage, gridprevpage);

                    }
                }

                // Tear down modal
                if(callback) callback();

            }
        );  // getJSON
    }

    function deletemealfromgrid(meal, callback) {

        if(deletebehavior == "shiftmeals") {

            dmealreplace(meal, callback);

        }
        else if(deletebehavior == "redrawgrid") {

            dmealredraw(meal, callback);

        }
        else {

            //console.log("Error in deletemealfromgrid: behavior not specified");
            // Fail big
            // dmealreplace(meal, callback);

        }
    }

    // Fill a picture grid from an array
    function fillfromarray(griddiv, mealinfo, callback) {

        // For each mealinfo
        for(cnt = 0 ; cnt < mealinfo.length ; cnt++) {

            // Create a gridpic
            var gridmeal = pdiv(mealinfo[cnt]);

            // Add it to the grid
            if(!addmealtogrid(griddiv, gridmeal, callback))
                break;
        }
    }

    // Create the picture grid
    function makegrid() {

        // Width string
        //var widthpx = gridwidth + 'px';

        var griddiv = $(dc('div'))
            .attr('class', 'picturegrid')
            //.css('margin-left', 'auto')
            //.css('margin-right', 'auto')
            .css('position', 'absolute')
            .css('float', 'left')
            .css('width', gridwidth + 'px');
    
        // Set first picture to null
        griddiv.first = null;

        // Set last picture to null
        griddiv.last = null;

        // Set count to 0
        griddiv.count = 0;

        return griddiv; 
    }

    // Universal display function
    function displaygrid(mealinfo, prevpage, nextpage, direction, callback) {

        // Short circuit if were already displaying
        if (displaying) {
            //console.log("displaygrid is already displaying");
            return false;
        }

        // Scrub arguments
        if (mealinfo == undefined || mealinfo.length <= 0) {
            //console.log("empty mealinfo");
            return false;
        }

        // Toggle displaying
        displaying = true;

        // Normalize nextpage
        nextpage = (null != nextpage) ? nextpage : gridnextpage;

        // Normalize prevpage
        prevpage = (null != prevpage) ? prevpage : gridprevpage;

        // If this isn't defined roll forward
        // direction = direction ? direction : 'forward';
        var forward = direction && direction == 'backwards' ? 
            false : true;

        // Keep count of pictures which have loaded
        var loaded = 0;

        // Determine last picture
        var endpic = (mealinfo.length < mealspergrid) ? 
            mealinfo.length : mealspergrid;

        // Make a new picture grid
        var newgrid = makegrid();

        // Cache the last mealinfo
        lastmealinfo = mealinfo;

        // The callback is fired once per meal in the array
        fillfromarray(newgrid, mealinfo, function(showImages) {

            if(++loaded == endpic) {

                // jQuery reference to currentgrid
                var $cg = currentgrid ? currentgrid : null;

                // jQuery reference to newgrid
                var $ng = $(newgrid);

                // Direction token
                var direction;

                // Last wins counter
                var count = 0;

                // How we know we're finished
                var target = $cg ? 2 : 1;

                // Animate if configured for it
                if(animatenextprev) {
    
                    // Set the left offscreen
                    $ng.css('left', '-10000px');
    
                    // Attach to viewport
                    $ng.appendTo(gridviewport);

                    // Position and direction token
                    if(forward) {
    
                        // Set direction
                        direction = '-=';
    
                        // Put just out of view in front
                        $ng.css('left', gridwidth + 'px');
    
                    }
                    else {
    
                        // Set direction
                        direction = '+=';
    
                        // Put just out of view in back
                        $ng.css('left', -gridwidth + 'px');
    
                    }
    
                    // Completion function
                    function alldone() {
    
                        // Last to run wins
                        if(++count == target) {
    
                            // Remove this entirely 
                            if($cg) $cg.remove();
    
                            // Set up my next and previous page links
                            nextprevpagelinks(nextpage, prevpage);
    
                            // This is the new current
                            currentgrid = newgrid;
    
                            // Invoke callback to link first picture
                            if(callback) {
    
                                // Normalize
                                var gobj = currentgrid.firstg ? 
                                    currentgrid.firstg.editgrid : null;
    
                                // Set gridobj
                                callback(gobj);
                            }
    
                            // End display mode
                            displaying = false;
                        }
                    }
    
                    // Animate entering grid
                    $ng.stop().animate(
                        { left : direction + gridwidth + 'px'},
                        gridspeed,
                        grideasing,
                        alldone
                    );
    
                    // Annimate leaving grid
                    if(currentgrid) {
                        $cg.stop().animate(
                            { left : direction + gridwidth + 'px'},
                            gridspeed,
                            grideasing,
                            alldone
                        )
                    }
                }
                else {

                    // Remove this entirely 
                    if($cg) $cg.remove();

                    // Attach to viewport
                    $ng.appendTo(gridviewport);

                    // Position nextgrid correctly
                    $ng.css('left', '0px');

                    // This is the new current
                    currentgrid = newgrid;

                    // Set up my next and previous page links
                    nextprevpagelinks(nextpage, prevpage);

                    if(callback) {

                        // Normalize
                        var gobj = currentgrid.firstg ? 
                            currentgrid.firstg.editgrid : null;

                        // Set gridobj
                        callback(gobj);
                    }
                    // End display mode
                    displaying = false;

                } // animatenextprev
            } // ++loaded == endpic
        }); // fillfromarray
    }

    // Return the container width
    function containerwidth() {

        return outercontainerwidth;

    }

    // Must be called before anything else
    function init(indiv, uname, pvpg, nxpg, cfg) {

        // Shorten function name
        cfg.hp = cfg.hasOwnProperty;

        // Where this will appear on the page
        parentdiv = indiv;

        // User's name
        username = uname;

        // Previous-page 
        gridprevpage = pvpg;

        // Next-page
        gridnextpage = nxpg;

        // Configurables
        //marginleft = cfg.hp("marginleft") ? cfg.marginleft : 36;
        marginleft = cfg.hp("marginleft") ? cfg.marginleft : 10;

        // What's the right margin
        //marginright = cfg.hp("marginright") ? cfg.marginright : 4;
        marginright = cfg.hp("marginright") ? cfg.marginright : 10;
    
        // What's the top margin
        margintop = cfg.hp("margintop") ? cfg.margintop : 20;

        // What's the bottom margin
        marginbottom = cfg.hp("marginbottom") ? cfg.marginbottom : 60;

        // What's the picture border
        picborder = cfg.hp("picborder") ? cfg.picborder : 10;

        // What's the container's top margin
        containermargintop = cfg.hp("containermargintop") ? 
            cfg.containermargintop : 10;
    
        // What's the container's bottom margin
        containermarginbottom = cfg.hp("containermarginbottom") ? 
            cfg.containermarginbottom : 10;

        // What's the container's right margin
        containermarginright = cfg.hp("containermarginright") ?
            cfg.containermarginright : 10;

        // What's the container's left margin
        containermarginleft = cfg.hp("containermarginleft") ? 
            cfg.containermarginleft : 10;

        // What's the width of a picture
        picturewidth = cfg.hp("picturewidth") ? cfg.picturewidth : 300;
    
        // What's the max heigth of a picture
        pictureheight = cfg.hp("pictureheight") ? cfg.pictureheight : 300;

        // What's the max height of a footer
        footerheight = cfg.hp("footerheight") ? cfg.footerheight : 60;

        // What's the footer's font size
        footerfontsize = cfg.hp("footerfontsize") ? cfg.footerfontsize : 16;

        // What's the size of the picture count text
        subfooterfontsize = cfg.hp("subfooterfontsize") ? cfg.subfooterfontsize : 13;

        // Space between footer and picture
        footerspace = cfg.hp("footerspace") ? cfg.footerspace : 0;
    
        // How many pictures per row
        mealsperrow = cfg.hp("mealsperrow") ? cfg.mealsperrow : 3;
    
        // How many rows per page
        rowsperpage = cfg.hp("rowsperpage") ? cfg.rowsperpage : 3;
    
        // Derived: how many meals per grid
        mealspergrid = mealsperrow * rowsperpage;
    
        // Calculate spacer width
        //spacerwidth = cfg.hp("spacerwidth") ? cfg.spacerwidth : 20;

        // Derived: how many pixels wide?
        gridwidth = ((picturewidth + marginleft + marginright + 
            (2 * picborder)) * mealsperrow);
    
        // Allow 
        nxpvcallback = cfg.hp("nxpvcallback") ? cfg.nxpvcallback : null;
    
        // Easing function
        grideasing = cfg.hp("grideasing") ? cfg.grideasing : 'grideasingfunc';
    
        // Speed to change pages
        gridspeed = cfg.hp("gridspeed") ? cfg.gridspeed : 1000;
    
        // Viewport width 
        viewportwidth = gridwidth;
    
        // Set the anchor click function
        anchorclickfn = cfg.hp("anchorclickfn") ? cfg.anchorclickfn : null;
    
        // Set the use-hover-text flag
        usehovertext = cfg.hp("usehovertext") ? cfg.usehovertext : null;

        // Set the top margin for the outer container
        outercontainermargintop = cfg.hp("outercontainermargintop") ? 
            cfg.outercontainermargintop : 10;

        // Set the top margin for the outer container
        outercontainermarginbottom = cfg.hp("outercontainermarginbottom") ? 
            cfg.outercontainermarginbottom : 10;

        // Set the left margin for the outer container
        outercontainermarginleft = cfg.hp("outercontainermarginleft") ? 
            cfg.outercontainermarginleft : 0;

        // Set the left margin for the outer container
        outercontainermarginright = cfg.hp("outercontainermarginright") ? 
            cfg.outercontainermarginright : 0;

        // Calculate the container grid height
        containerheight = rowsperpage * (pictureheight + footerheight +
                + (2 * picborder) + margintop + marginbottom);

        // Outer container height
        outercontainerheight = containerheight + containermargintop +
            containermarginbottom;

        // Outer container width
        outercontainerwidth = viewportwidth + containermarginleft +
            containermarginright;

        // We are not running display code
        displaying = false;

        // Display 'picture count' underneath the grid
        picturecounttrace = cfg.hp("picturecounttrace") ? 
            cfg.picturecounttrace : true;

        // Display 'picture time' underneath the grid
        picturetimetrace = cfg.hp("picturetimetrace") ?
            cfg.picturetimetrace : true;

        // Display date in slashed (MM/DD/YYYY) format.
        slasheddate = cfg.hp("slasheddate") ? 
            cfg.slasheddate : false;

        // Configure alignment of the footer text
        footeralign = cfg.hp("footeralign") ? cfg.footeralign : 'center';

        // Display a picture's title underneath the grid
        titletrace = cfg.hp("titletrace") ? cfg.titletrace : true;

        // Grid pic title's font color
        titlefontcolor = cfg.hp("titlefontcolor") ? cfg.titlefontcolor : "#555";

        // Animate next and prev page
        animatenextprev = cfg.hp("animatenextprev") ? cfg.animatenextprev : 
            false;

        // Set the modalisup callback
        modalisup = cfg.hp("modalisup") ? cfg.modalisup : null;

        // Default to 'shiftmeals' because it's already written
        deletebehavior = "redrawgrid";

        // Set the delete meal behavior
        if(cfg.hp("deletebehavior")) {

            // I can either delete in place or redraw the grid
            if(cfg.deletebehavior == "shiftmeals")
                deletebehavior = "shiftmeals";

            if(cfg.deletebehavior == "redrawgrid")
                deletebehavior = "redrawgrid";
        }
        

        // Set the easing function in jQuery
        if(!$.easing[grideasing]) {
            $.easing[grideasing] = function (x, t, b, c, d) {
                return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
            }
        }
    
        // Linear find picindex 
        function findpicidxlinear(pinfo, timestamp) {
    
            for(var ii = 0 ; ii < pinfo.length ; ii++) {
                if(pinfo[ii].timestamp == timestamp)
                    return ii;
            }
            return -1;
        }
    
        // Set findpicidx
        findpicidx = cfg.hp("findpicidx") ? cfg.findpicidx : findpicidxlinear;

        // Height will change as pictures are added
        gridviewport = $(dc('div'))
            .attr('id', 'gridviewport')
            .attr('class', 'gridviewport')
            //.css('position', 'relative')
            .css('top', '0px')
            .css('float', 'left')
            .css('height', containerheight + 'px')
            .css('width', viewportwidth + 'px');
    
        // Container holds viewport which will hide picture edges
        gridcontainer = $(dc('div'))
            .attr('id', 'gridcontainer')
            .attr('class', 'gridcontainer')
            .css('height', containerheight + 'px')
            .css('width', gridwidth + 'px')
            .css('overflow', 'hidden')
            .css('position', 'relative');
    
        // Outer container is background
        gridoutercontainer = $(dc('div'))
            .attr('id', 'gridoutercontainer')
            .attr('class', 'gridoutercontainer')
            .css('height', outercontainerheight + 'px')
            .css('width', outercontainerwidth + 'px')
            .css('margin-top', outercontainermargintop + 'px')
            .css('margin-bottom', outercontainermarginbottom + 'px')
            .css('margin-left', outercontainermarginleft + 'px')
            .css('margin-right', outercontainermarginright + 'px')
            .css('-moz-border-radius', '15px')
            .css('border-radius', '15px')
            .css('border', '1px solid')
            .css('background-color', '#eee')
            .css('position', 'relative');

        // Set the viewport height dynamically
        viewportheight = 0;
    
        // Append the viewport to the container
        gridviewport.appendTo(gridcontainer);

        gridcontainer.appendTo(gridoutercontainer);
    
        // Append this to the parentdiv if there is one
        if(parentdiv) {
            gridoutercontainer.appendTo(parentdiv);
        }
    }

    // Exposed functions
    return {
        init                        : init,
        displaygrid                 : displaygrid,
        mealcount                   : mealcount,
        updatedisplaypicture        : updatedisplaypicture,
        deletemealfromgrid          : deletemealfromgrid,
        updatepicturecount          : updatepicturecount,
        updatetitle                 : updatetitle,
        updatemeal                  : updatemeal,
        setnewmealanchor            : setnewmealanchor,
        containerwidth              : containerwidth
    };
}(jQuery));
