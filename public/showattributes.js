// Show attributes 
showattributes = (function($jq) {

    // Cache jquery
    var $ = $jq;

    // Keep track of the maskfade width
    var maskfadewidth;

    // Grid object coresponding to modal
    var gridobj;

    // Set search function
    var findpicidx; 

    // Hold popup in here
    var popup;

    // Holds carousel object
    var elm;

    // Hold fademask in here
    var maskfade=null;

    // Minimum mask width
    var minmaskfadewidth;

    // The maximum picture height
    var maxpicheight;

    // Mask height
    var maskfadeheight;

    // Opacity
    var maskfadeopacity;

    // Where to append the 
    var appendpop;

    // Width of modal
    var modalwidth;

    // Hidden frame
    var hiddenframe;

    // Grid delete function
    var griddelete;

    // Set the display picture
    var setgriddisplay;

    // Set the grid title
    var setgridtitle;

    // Set the update count function
    var setgridcount;

    // Set the meal on the grid
    var setgridmeal;

    // Element creator
    var dc;

    // Keep track of the window's width
    var windowwidth;

    // Keep track of the window's height
    var windowheight;

    // Create a carousel
    var createcarousel;

    // Whether this is showing
    var isshowing;
 
    // Whether to show the calendar
    var showdate;

    // Whether to show the rating
    var showrating;

    // Whether to show whichmeal
    var showwhichmeal;

    // Whether to show the review
    var showreview;

    // Whether to show the delete link
    var showdelete;

    // Mask fade bottom margin
    var maskfadebottommargin;

    // Prompt delete meal
    var promptdeletemeal;

    // Prompt delete picture
    var promptdeletepic;

    // Use simpleprompts
    var usesimpleprompt;

    // Show the 'dont prompt me' option
    var showdontprompt;

    // Popup button widths
    var popupbuttonwidth;

    // Button margins
    var buttonmargin;

    // Can dismiss
    var candismiss = true;

    // Delete anchor
    var deleteanchor = null;

    // Upload anchor
    var uploadanchor = null;

    // Key anchor
    var keyanchor = null;

    // Holds the subcarousel
    var subcarousel = null;

    // Maximum pictures per meal
    var maxpicspermeal;

    // Update the rating
    function updateRatingAjax(meal, rating) {
        $.ajax({
            url: '/saverating',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(
                {
                    username: meal.userid,
                    timestamp: meal.timestamp,
                    rating: rating
                }),
            dataType: 'json',
            complete: function(resp, astat) {
            }
        });
    }
    
    // Make this a key picture
    function makeKeyPicAjax(meal, picInfo) {
        $.ajax({
            url: '/updatekeypic',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(
                {
                    username: meal.userid,
                    mealts: meal.timestamp,
                    keyts: picInfo.timestamp,
                }),
            dataType: 'json',
            complete: function(resp, astat) {
            }
        });
    }
    
    // Delete this picture
    function deletePicAjax(meal, picInfo) {
        $.ajax({
            url: '/deletepic',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(
                {
                    username: meal.userid,
                    mealts: meal.timestamp,
                    timestamp: picInfo.timestamp,
                }),
            dataType: 'json',
            complete: function(resp, astat) {
            }
        });
    }
    
    // Update the server meal
    function updateMealAjax(meal, newMeal) {
        $.ajax({
            url: '/savemeal',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(
                {
                    username: meal.userid,
                    timestamp: meal.timestamp,
                    meal: newMeal
                }),
            dataType: 'json',
            complete: function(resp, astat) {
            }
        });
    }
    
    // Update the server review
    function updateReviewAjax(meal, review) {
        $.ajax({
            url: '/savereview',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(
                {
                    username: meal.userid,
                    timestamp: meal.timestamp,
                    review: review
                }),
            dataType: 'json',
            // TODO: consolidated JSON response handling
            complete: function(resp, astat){
            }
        });
    }
    
    // Update the server mealdate
    function updateMealDateAjax(meal, mealdate) {
        $.ajax({
            url: '/savemealdate',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(
                {
                    username: meal.userid,
                    timestamp: meal.timestamp,
                    mealdate: mealdate
                }),
            dataType: 'json',
            // TODO: consolidated JSON response handling
            complete: function(resp, astat){
            }
        });
    }

    // Set the griddelete function
    function setgriddeletecallback(callback) {

        griddelete = callback;

    }

    // Calculate size of the modal textarea
    function gettextareawidth() {

        $.browser.chrome = /chrome/.test(navigator.userAgent.toLowerCase());

        // Return 65 if we're mozilla
        if($.browser.mozilla) {
            return 65;
        }

        // Return 57 if we're chrome
        if($.browser.chrome) {
            return 57;
        }

        // Default to 65
        return 65;
    }

    // Set textarea width
    var textareawidth = gettextareawidth();

    // Glue to set the grid title 
    function setgridtitlecallback(callback) {

        setgridtitle = callback;

    }

    // Glue to set the grid display picture
    function setgriddisplaycallback(callback) {

        setgriddisplay = callback;

    }

    // Callback to update the grid counter
    function setgridcountcallback(callback) {

        setgridcount = callback;

    }

    // Callback to update grid meal
    function setgridmealcallback(callback) {

        setgridmeal = callback;

    }


    // Tear down
    function destroymodal(faded) {

        // TODO: maybe popup here?  'You are in the middle of an operation .. are you sure?'
        if(!candismiss)
            return;

        // Destroy carousel
        elm.destroy();

        // Nullify
        elm = null;

        // See if 
        if(!faded) {

            // Fade out popup
            popup.fadeOut(0);

            // Remove background
            maskfade.css({'display':'none'});
        }

        // Remove popup
        popup.remove();

        // nullify attribute
        popup = null;

        // nullify gridobj
        //gridobj = null;

        // We are not showing
        isshowing = false;

    }

    // Return true if the modal is showing
    function modalisshowing() {

        return isshowing;

    }

    // Fade then tear down
    function fadedestroymodal() {

        var fadedcnt=0;

        // Fade out the popup
        popup.fadeOut(
            100,
            function() { 
                ++fadedcnt;
                if(2 == fadedcnt) {
                    destroymodal(true); 
                }
            }
        );

        // Fade out the background
        maskfade.fadeOut(
            100,
            function() { 
                ++fadedcnt;
                if(2 == fadedcnt) {
                    destroymodal(true); 
                }
            }
        );
    }

    // Update sizes
    function updatewindowdims() {

        // Set width of the window
        windowwidth = $(window).width();

        // Set height of the window
        windowheight = $(window).height();

    }

    // Set dimensions & display modal
    function positionmodal() {

        // Half the width of the modal
        var left = modalwidth / 2;

        // Half the width of the mask
        var halfmaskwidth = windowwidth / 2;

        // Location of the left side of the popup
        var popupleft = halfmaskwidth - left;

        // Top stays static
        popup.css('top', 30);

        // Set the left
        popup.css('left', popupleft);

    }

    // TODO: resize handler function
    function adjustmaskfade() {

        // Get window width
        var wid = windowwidth;

        // Get the current document height
        maskfadeheight = $(document).height();

        // Set css
        maskfade.css(
            {
                'width':wid + 'px', 
                'height': maskfadeheight + maskfadebottommargin + 'px', 
                'display':'block'
            }
        );
    }

    // Set dimensions & display background
    function showmaskfade() {

        // Get window width
        var wid = windowwidth;

        // Get the current document height
        maskfadeheight = $(document).height();

        // Set sane minimum
        if(wid < minmaskfadewidth) 
            wid = minmaskfadewidth;

        // Set css
        maskfade.css(
            {
                'width':wid + 'px', 
                'height': maskfadeheight + maskfadebottommargin + 'px', 
                'opacity':maskfadeopacity, 
                'display':'block'
            }
        );

        // Set new maskfadewidth
        maskfadewidth = wid;
    }

    // Meal attributes / edit modal
    function uploadmealpopup(username, mealts, callback) {
    
        $(hiddenframe).empty();
    
        var hiddeniframe = $(dc('iframe'))
            .attr('style', 'width:0px;height:0px;border:0px;')
            .attr('name', 'hiddeniframe')
            .attr('id', 'hiddeniframe');
    
        var uploadform = $(dc('form'))
            .attr('id', 'uploadform')
            .attr('name', 'uploadform')
            .attr('method', 'post')
            .attr('enctype', 'multipart/form-data')
            .attr('action', '/editmealsupload')
            .attr('target', 'hiddeniframe');
    
        uploadform.appendTo(hiddeniframe);
    
        // Wait for the html of the hidden iframe to change: tells you that
        // the upload was successful.
        var fileupload = $(dc('input'))
            .attr('type', 'file')
            .attr('name', 'inputupload')
            .attr('id', 'inputupload');
    
        // Pass the userid.
        var userid = $(dc('input'))
            .attr('type', 'hidden')
            .attr('name', 'username')
            .attr('id', 'username')
            .val(username);
    
        // Send the timestamp of the corresponding meal
        var mealtimestamp = $(dc('input'))
            .attr('type', 'hidden')
            .attr('name', 'mealInfo')
            .attr('id', 'mealInfo')
            .val(mealts);
    
        hiddeniframe.appendTo(hiddenframe);
    
        var cnt = 0;
    
        // TODO - this could be slow.. maybe i could show a popup bar 
        // saying that things are uploading?
        function checkuploaded() {
    
            // Jquery-ize hidden iframe
            var $hiddeniframe = $(hiddeniframe);

            // Grab the text
            var bodytext = $hiddeniframe.contents().find('body').html();
    
            // The format is 'SUCCESS <timestamp> <mealheight> <thumbheight> <thumbwidth>"
            var regex = /^SUCCESS [0-9]+ [0-9]+ [0-9]+ [0-9]+$/;

            // Have maximum pictures format - just another failure
            var maxpex = /^HAVE MAXIMUM PICS FOR THIS MEAL [0-9]+$/;
    
            // TODO: put a reasonable hard-timeout here.
            //
            // if the timeout expires, reload the 'main' page with a special
            // tag that says 'edit the first picture if it's greater than the 
            // first picture I've ever seen (pass that in the request).  Otherwise, 
            // print an error message.
            if(null == bodytext || bodytext == "") {

                //console.log('checkuploaded bodytext is null - resetting timeout, cnt is ' + cnt++);
                setTimeout(checkuploaded, 500);
                return;

            }

            // Success case 
            if(regex.test(bodytext)) {
    
                // Split on the spaces
                var ar = bodytext.split(" ");
    
                // Retrieve picture timestamp
                var picts = parseInt(ar[1], 10);
    
                // Retrieve picture height
                var height = parseInt(ar[2], 10);

                // Retrieve thumbnail height
                var thumbheight = parseInt(ar[3], 10);
    
                // Retrieve thumb width
                var thumbwidth = parseInt(ar[4], 10);

                // Create minimal picinfo
                var pinfo = { 
                    'timestamp'     : picts, 
                    'height'        : height, 
                    'thumbheight'   : thumbheight,
                    'thumbwidth'    : thumbwidth
                };
    
                // Debug messages
                /*
                //console.log('checkuploaded timestamp is ' + picts);
                //console.log('checkuploaded height is ' + height);
                //console.log('cnt is ' + cnt++);
                */
    
                // Add to the picture-mobile
                callback(null, pinfo);
                candismiss = true;
                return;
            }
            else {

                // Redirect to the homepage on error
                //console.log('Error from server: ' + bodytext);
                window.location.replace("/");
            }
        }
    
        // Invoked when the user selects a file
        fileupload.change(function() {

            candismiss = false;
            uploadform.submit();
            setTimeout(checkuploaded, 500);

        });
    
        // Append these to the form
        fileupload.appendTo(uploadform);
        userid.appendTo(uploadform);
        mealtimestamp.appendTo(uploadform);
    
        // Display a dialog box
        $(fileupload).click();
    
    }

    // function which creates the delete meal dom
    function createdeletepicprompt(yescb, nocb, dontpromptcb) {

        // Containing div
        var promptdiv = $(dc('div'))
            .css('display', 'none');

        // Paragraph
        var questionp = $(dc('p'))
            .css('border', 'none');
            //.css('padding', rmargin + 'px');

        // Text label
        var label = $(dc('label'))
            .html('Delete this picture?');

        // Build label paragraph
        label.appendTo(questionp);

        // Button paragraph
        var buttonp = $(dc('p'))
            .css('border', 'none')
            .css('padding', '0px');

        // Yes button
        var yesbutton = $(dc('input'))
            .attr('type', 'button')
            .css('width', popupbuttonwidth + 'px')
            .css('margin-right', buttonmargin + 'px')
            .css('margin-left', buttonmargin + 'px')
            .attr('value', 'Confirm');

        // No button
        var nobutton = $(dc('input'))
            .attr('type', 'button')
            .css('width', popupbuttonwidth + 'px')
            .css('margin-right', buttonmargin + 'px')
            .css('margin-left', buttonmargin + 'px')
            .attr('value', 'Cancel');

        // Don't prompt button
        var dontprompt = $(dc('input'))
            .attr('type', 'button')
            .css('margin-right', buttonmargin + 'px')
            .css('margin-left', buttonmargin + 'px')
            .css('width', popupbuttonwidth + 'px')
            .attr('value', 'Don\'t show this prompt');

        // Create yes button if callback was passed
        if(yescb) {
            yesbutton.click(function(){yescb();});
        }

        // Create no button if callback was passed
        if(nocb) {
            nobutton.click(function(){nocb();});
        }

        // Create dont prompt button if callback was passed
        if(dontpromptcb) {
            dontprompt.click(function(){dontpromptcb();});
        }

        // Append to modal
        yesbutton.appendTo(buttonp);
        nobutton.appendTo(buttonp);

        // Show this only if it's enabled
        if(showdontprompt)
            dontprompt.appendTo(buttonp);

        // Build div
        questionp.appendTo(promptdiv);
        buttonp.appendTo(promptdiv);

        // Return completed prompt
        return promptdiv;
    }

    // function which creates the delete meal dom
    function createdeletemealprompt(yescb, nocb, dontpromptcb) {

        // margin changes depending on shown options
        var rmargin = showdontprompt ? 10 : 20;

        // Containing div
        var promptdiv = $(dc('div'))
            .css('display', 'none');

        // Paragraph
        var questionp = $(dc('p'))
            .css('border', 'none')
            .css('padding', '10px');

        // Text label
        var label = $(dc('label'))
            .html('Delete meal and all pictures?');

        // Build label paragraph
        label.appendTo(questionp);

        // Button paragraph
        var buttonp = $(dc('p'))
            .css('border', 'none')
            .css('padding', '0px');

        // Yes button
        var yesbutton = $(dc('input'))
            .attr('type', 'button')
            .css('width', popupbuttonwidth + 'px')
            .css('margin-right', buttonmargin + 'px')
            .css('margin-left', buttonmargin + 'px')
            .attr('value', 'Confirm');

        // No button
        var nobutton = $(dc('input'))
            .attr('type', 'button')
            .css('width', popupbuttonwidth + 'px')
            .css('margin-right', buttonmargin + 'px')
            .css('margin-left', buttonmargin + 'px')
            .attr('value', 'Cancel');

        // Don't prompt button
        var dontprompt = $(dc('input'))
            .attr('type', 'button')
            .css('width', popupbuttonwidth + 'px')
            .css('margin-right', buttonmargin + 'px')
            .css('margin-left', buttonmargin + 'px')
            .attr('value', 'Don\'t show this prompt');

        // Create yes button if callback was passed
        if(yescb) {
            yesbutton.click(function(){yescb();});
        }

        // Create no button if callback was passed
        if(nocb) {
            nobutton.click(function(){nocb();});
        }

        // Create dont prompt button if callback was passed
        if(dontpromptcb) {
            dontprompt.click(function(){dontpromptcb();});
        }

        // Append to modal
        yesbutton.appendTo(buttonp);
        nobutton.appendTo(buttonp);

        // Show this only if its enabled
        if(showdontprompt) {
            dontprompt.appendTo(buttonp);
        }

        // Build div
        questionp.appendTo(promptdiv);
        buttonp.appendTo(promptdiv);

        // Return completed prompt
        return promptdiv;
    }

    // function which creates the delete anchor
    function createdeleteanchor(meal) {

        var deleteAnchor = $(dc('a'))
            .attr('id', 'deletePictureAnchor')
            .attr('class', 'carousel_caption deletePictureAnchor grid_3')
            .html('Delete Picture');
    
        // Click handler
        deleteAnchor.click(function() {

            if(promptdeletepic) {
                if(usesimpleprompt) {
                    var answer = confirm("Delete this picture?");
                    if(answer) removepic();
                }
                else {
                    var dpprompt = createdeletepicprompt(
                        function() {
                            removepic();
                            $.unblockUI();
                        },
                        function() {
                            $.unblockUI();
                        },
                        function() {
                            promptdeletepic = false;
                            removepic();
                            $.unblockUI();
                        }
                    );

                    $.blockUI({message: dpprompt});

                }
            }
            else {
                removepic();
            }
    
            // Encapsulate in a function
            function removepic() {

                // Remove picture from carousel
                elm.removepicture(function(removed, pinfo) {
        
                    if(removed) {
        
                        // Find index of removed photo
                        var ii = findpicidx(meal.picInfo, pinfo.timestamp);
        
                        // Remove this picture
                        if(ii >= 0) {
                            meal.picInfo.splice(ii, 1);
                        }
        
                        var changepic = false;
        
                        // Delete from mongo
                        deletePicAjax(meal, pinfo);
        
                        // Was this a key picture
                        if(pinfo.timestamp == meal.keytimestamp) {
        
                            changepic = true;
                            meal.keytimestamp = 0;
        
                        }
        
                        // If this was the first picture
                        if(!meal.keytimestamp && ii == 0) {
                            changepic = true;
                        }
        
                        // Changing the displaypic
                        if(changepic) {
                            var pinfo0;
        
                            // Get new key picture
                            if(meal.picInfo.length > 0) {
                                pinfo0 = meal.picInfo[0];
                            }
        
                            // Set new display picture
                            if(setgriddisplay) {
                                setgriddisplay(meal, pinfo0);
                            }
                        }
        
                        // Update grid picture count
                        if(setgridcount)
                            setgridcount(meal);
                    }
                });
            }
        });

        return deleteAnchor;
    }
    
    // Internal function to create the key anchor
    function createkeyanchor(meal) {
        var makeKeyAnchor = $(dc('a'))
            .attr('id', 'keyAnchor')
            .attr('class', 'carousel_caption keyAnchor grid_2')
            .html('Make Key Photo');
    
        // Make this general & use same code for delete [0] case
        makeKeyAnchor.click(function() {
    
            // ajax for username, mealts, and keyts
            elm.makekeypicture(function(success, pinfo) {
    
                if(success) {
    
                    // Update mongo on the server
                    makeKeyPicAjax(meal, pinfo);
    
                    // Set the display picture
                    if(setgriddisplay) {
                        setgriddisplay(meal, pinfo);
                    }
                }
            });
        });
        return makeKeyAnchor;
    }


    // Internal function creates the subcarousel upload anchor
    function createuploadanchor(meal) {

        // Create anchor object
        var uploadAnchor = $(dc('a'))
            .attr('id', 'uploadPictureAnchor')
            .attr('class', 'carousel_caption uploadPictureAnchor grid_3')
            .html('Upload New Picture');
    
        // Click function for the upload anchor
        uploadAnchor.click(function() {
    
            // Popup works from a hidden frame
            uploadmealpopup(meal.userid, meal.timestamp, function(err, pinfo) {
    
                // Throw any errors
                if(err) throw(err);

                if(pinfo) {
        
                    // Add this to the carousel
                    elm.addpicture(pinfo, false, false, function(added, ckfirst, ts) {
        
                        if(added) {
        
                            // Make key photo if this was the first
                            if(ckfirst && setgriddisplay) {
                                setgriddisplay(meal, pinfo);
                            }
        
                            // console.log('pushing ' + pinfo.timestamp + ' ts is ' + ts);
        
                            // Push this picture onto the meal.picInfo array
                            meal.picInfo.push(pinfo);
        
                            // Update picture count
                            if(setgridcount) 
                                setgridcount(meal);
                        }
        
                        // Set the focus back on the carousel
                        elm.focus();
                    });
                }
            });
        });

        return uploadAnchor;
    }

    // Create the rating object
    function makepoprating(meal) {

        // Rating selector container
        var grid_stars = $(dc('div'))
            .attr('class', 'grid_5')
            .attr('id', 'pop_rating')
            .attr('name', 'name_rating');

        // Create a sub-div that will contain the star-elements
        var grid_stars_select_div = $(dc('div'))
            .attr('class', 'stars_select_menu_div')
            .attr('id', 'stars_select_menu_div');
    
        // Start an unordered list
        var grid_stars_select = $(dc('ul'))
            .attr('class', 'stars_select_menu')
            .attr('id', 'stars_select_menu')
            .attr('name', 'stars_select_menu');
    
        // There will be five of them
        var grid_stars_select_stars_0 = $(dc('li'))
            .attr('class', 'star_select_menu_selection')
            .attr('name', 'star_select_menu_0')
            .attr('id', 'star_select_menu_0');
    
        var grid_stars_select_stars_0_anchor = $(dc('a'))
            .attr('id', 'stars_select_stars_0_anchor')
            .attr('class', 'stars_select_anchor')
            .css({ 'color' : '#fff' })
            .html('&#11036');
    
        var grid_stars_select_stars_1_anchor = $(dc('a'))
            .attr('id', 'stars_select_stars_1_anchor')
            .attr('class', 'stars_select_anchor')
            .html('&#9733;');
    
        var grid_stars_select_stars_2_anchor = $(dc('a'))
            .attr('id', 'stars_select_stars_2_anchor')
            .attr('class', 'stars_select_anchor')
            .html('&#9733;');
    
        var grid_stars_select_stars_3_anchor = $(dc('a'))
            .attr('id', 'stars_select_stars_3_anchor')
            .attr('class', 'stars_select_anchor')
            .html('&#9733;');
    
        var grid_stars_select_stars_4_anchor = $(dc('a'))
            .attr('id', 'stars_select_stars_4_anchor')
            .attr('class', 'stars_select_anchor')
            .html('&#9733;');
    
        var grid_stars_select_stars_5_anchor = $(dc('a'))
            .attr('id', 'stars_select_stars_5_anchor')
            .attr('class', 'stars_select_anchor')
            .html('&#9733;');
    
        // TODO - this could be more efficient 
        function reset_stars_select_classes_hover() {
            grid_stars_select_stars_0_anchor.removeClass("stars_unselected_star_hover");
            grid_stars_select_stars_1_anchor.removeClass("stars_unselected_star_hover");
            grid_stars_select_stars_2_anchor.removeClass("stars_unselected_star_hover");
            grid_stars_select_stars_3_anchor.removeClass("stars_unselected_star_hover");
            grid_stars_select_stars_4_anchor.removeClass("stars_unselected_star_hover");
            grid_stars_select_stars_5_anchor.removeClass("stars_unselected_star_hover");
    
            grid_stars_select_stars_0_anchor.removeClass("stars_selected_star_hover");
            grid_stars_select_stars_1_anchor.removeClass("stars_selected_star_hover");
            grid_stars_select_stars_2_anchor.removeClass("stars_selected_star_hover");
            grid_stars_select_stars_3_anchor.removeClass("stars_selected_star_hover");
            grid_stars_select_stars_4_anchor.removeClass("stars_selected_star_hover");
            grid_stars_select_stars_5_anchor.removeClass("stars_selected_star_hover");
        }
    
        // TODO - this could be more efficient 
        function reset_stars_select_classes() {
            grid_stars_select_stars_0_anchor.removeClass("stars_selected_star");
            grid_stars_select_stars_1_anchor.removeClass("stars_selected_star");
            grid_stars_select_stars_2_anchor.removeClass("stars_selected_star");
            grid_stars_select_stars_3_anchor.removeClass("stars_selected_star");
            grid_stars_select_stars_4_anchor.removeClass("stars_selected_star");
            grid_stars_select_stars_5_anchor.removeClass("stars_selected_star");
    
            grid_stars_select_stars_0_anchor.removeClass("stars_unselected_star");
            grid_stars_select_stars_1_anchor.removeClass("stars_unselected_star");
            grid_stars_select_stars_2_anchor.removeClass("stars_unselected_star");
            grid_stars_select_stars_3_anchor.removeClass("stars_unselected_star");
            grid_stars_select_stars_4_anchor.removeClass("stars_unselected_star");
            grid_stars_select_stars_5_anchor.removeClass("stars_unselected_star");
    
            if(meal.rating >= 1) {
                grid_stars_select_stars_1_anchor.attr('class', 'stars_selected_star');
            }
            else {
                grid_stars_select_stars_1_anchor.attr('class', 'stars_unselected_star');
            }
    
            if(meal.rating >= 2) {
                grid_stars_select_stars_2_anchor.attr('class', 'stars_selected_star');
            }
            else {
                grid_stars_select_stars_2_anchor.attr('class', 'stars_unselected_star');
            }
    
            if(meal.rating >= 3) {
                grid_stars_select_stars_3_anchor.attr('class', 'stars_selected_star');
            }
            else {
                grid_stars_select_stars_3_anchor.attr('class', 'stars_unselected_star');
            }
            if(meal.rating >= 4) {
                grid_stars_select_stars_4_anchor.attr('class', 'stars_selected_star');
            }
            else {
                grid_stars_select_stars_4_anchor.attr('class', 'stars_unselected_star');
            }
            if(meal.rating >= 5) {
                grid_stars_select_stars_5_anchor.attr('class', 'stars_selected_star');
            }
            else {
                grid_stars_select_stars_5_anchor.attr('class', 'stars_unselected_star');
            }
        }
    
        reset_stars_select_classes();
    
        function star_click(rating) {
            if(rating < 0 || rating > 5)
                return false;
            if(meal.rating == rating)
                return false;
            meal.rating = rating;
            updateRatingAjax(meal, rating);
            return false;
        }
    
        grid_stars_select_stars_0_anchor.mouseenter(
            function() {
                reset_stars_select_classes_hover();
                grid_stars_select_stars_1_anchor.addClass("stars_unselected_star_hover");
                grid_stars_select_stars_2_anchor.addClass("stars_unselected_star_hover");
                grid_stars_select_stars_3_anchor.addClass("stars_unselected_star_hover");
                grid_stars_select_stars_4_anchor.addClass("stars_unselected_star_hover");
                grid_stars_select_stars_5_anchor.addClass("stars_unselected_star_hover");
                }
        );
    
        grid_stars_select_stars_0_anchor.click(function() {
                star_click(0);
        });
    
        grid_stars_select_stars_0_anchor.appendTo(grid_stars_select_stars_0);
    
        var grid_stars_select_stars_1 = $(dc('li'))
            .attr('class', 'star_select_menu_selection')
            .attr('name', 'star_select_menu_1')
            .attr('id', 'star_select_menu_1');
    
        grid_stars_select_stars_1_anchor.mouseenter(
            function() {
                reset_stars_select_classes_hover();
                grid_stars_select_stars_1_anchor.addClass("stars_selected_star_hover");
                grid_stars_select_stars_2_anchor.addClass("stars_unselected_star_hover");
                grid_stars_select_stars_3_anchor.addClass("stars_unselected_star_hover");
                grid_stars_select_stars_4_anchor.addClass("stars_unselected_star_hover");
                grid_stars_select_stars_5_anchor.addClass("stars_unselected_star_hover");
                }
        );
    
        grid_stars_select_stars_1_anchor.click(function() {
                star_click(1);
        });
    
        grid_stars_select_stars_1_anchor.appendTo(grid_stars_select_stars_1);
    
        var grid_stars_select_stars_2 = $(dc('li'))
            .attr('class', 'star_select_menu_selection')
            .attr('name', 'star_select_menu_2')
            .attr('id', 'star_select_menu_2');
    
        grid_stars_select_stars_2_anchor.mouseenter(
            function() {
                reset_stars_select_classes_hover();
                grid_stars_select_stars_1_anchor.addClass("stars_selected_star_hover");
                grid_stars_select_stars_2_anchor.addClass("stars_selected_star_hover");
                grid_stars_select_stars_3_anchor.addClass("stars_unselected_star_hover");
                grid_stars_select_stars_4_anchor.addClass("stars_unselected_star_hover");
                grid_stars_select_stars_5_anchor.addClass("stars_unselected_star_hover");
            }
        );
        grid_stars_select_stars_2_anchor.click(function() {
                star_click(2);
        });
    
        grid_stars_select_stars_2_anchor.appendTo(grid_stars_select_stars_2);
    
        var grid_stars_select_stars_3 = $(dc('li'))
            .attr('class', 'star_select_menu_selection')
            .attr('name', 'star_select_menu_3')
            .attr('id', 'star_select_menu_3');
    
        grid_stars_select_stars_3_anchor.mouseenter(
            function() {
                reset_stars_select_classes_hover();
                grid_stars_select_stars_1_anchor.addClass("stars_selected_star_hover");
                grid_stars_select_stars_2_anchor.addClass("stars_selected_star_hover");
                grid_stars_select_stars_3_anchor.addClass("stars_selected_star_hover");
                grid_stars_select_stars_4_anchor.addClass("stars_unselected_star_hover");
                grid_stars_select_stars_5_anchor.addClass("stars_unselected_star_hover");
            }
        );
    
        grid_stars_select_stars_3_anchor.click(function() {
                star_click(3);
        });
        grid_stars_select_stars_3_anchor.appendTo(grid_stars_select_stars_3);
    
        var grid_stars_select_stars_4 = $(dc('li'))
            .attr('class', 'star_select_menu_selection')
            .attr('name', 'star_select_menu_4')
            .attr('id', 'star_select_menu_4');
    
        grid_stars_select_stars_4_anchor.mouseenter(
            function() {
                reset_stars_select_classes_hover();
                grid_stars_select_stars_1_anchor.addClass("stars_selected_star_hover");
                grid_stars_select_stars_2_anchor.addClass("stars_selected_star_hover");
                grid_stars_select_stars_3_anchor.addClass("stars_selected_star_hover");
                grid_stars_select_stars_4_anchor.addClass("stars_selected_star_hover");
                grid_stars_select_stars_5_anchor.addClass("stars_unselected_star_hover");
            }
        );
    
        grid_stars_select_stars_4_anchor.click(function() {
                star_click(4);
        });
        grid_stars_select_stars_4_anchor.appendTo(grid_stars_select_stars_4);
    
        var grid_stars_select_stars_5 = $(dc('li'))
            .attr('class', 'star_select_menu_selection')
            .attr('name', 'star_select_menu_5')
            .attr('id', 'star_select_menu_5');
    
        grid_stars_select_stars_5_anchor.mouseenter(
            function() {
                reset_stars_select_classes_hover();
                grid_stars_select_stars_1_anchor.addClass("stars_selected_star_hover");
                grid_stars_select_stars_2_anchor.addClass("stars_selected_star_hover");
                grid_stars_select_stars_3_anchor.addClass("stars_selected_star_hover");
                grid_stars_select_stars_4_anchor.addClass("stars_selected_star_hover");
                grid_stars_select_stars_5_anchor.addClass("stars_selected_star_hover");
            }
        );
    
        grid_stars_select_stars_5_anchor.click(function() {
                star_click(5);
        });
        grid_stars_select_stars_5_anchor.appendTo(grid_stars_select_stars_5);
    
        grid_stars_select_div.mouseleave(function() {
            reset_stars_select_classes_hover();
            reset_stars_select_classes();
        });
    
        grid_stars_select_stars_0.appendTo(grid_stars_select);
        grid_stars_select_stars_1.appendTo(grid_stars_select);
        grid_stars_select_stars_2.appendTo(grid_stars_select);
        grid_stars_select_stars_3.appendTo(grid_stars_select);
        grid_stars_select_stars_4.appendTo(grid_stars_select);
        grid_stars_select_stars_5.appendTo(grid_stars_select);
    
        grid_stars_select.appendTo(grid_stars_select_div);
    
        // Append this to grid_stars..
        grid_stars_select_div.appendTo(grid_stars);
        
        // Return this
        return grid_stars;
    }

    // Create the grid-date object
    function makepopdate(meal) {

        var mealDate = MEALINFO.mealDateToDate(meal.mealDate);
    
        var grid_date = $(dc('div'))
            .attr('class', 'grid_5')
            .attr('id', 'pop_date');

        var grid_date_anchor = $(dc('a'))
            .attr('id', 'pop_date_anchor')
            .attr('class', 'pop_date_anchor')
            .attr('title', 'click to edit')
            .css({'display':'inline-block'});
    
        var grid_date_text = $(dc('div'))
            .attr('id', 'pop_date_text')
            .attr('class', 'pop_date_text')
            .html(new Date(mealDate).asMyString());
    
        grid_date_text.appendTo(grid_date_anchor);
    
        var grid_date_input = $(dc('input'))
            .attr('type', 'text')
            .attr('class', 'pop_date_input')
            .attr('id', 'pop_date_input')
            .attr('name', 'pop_date_input')
            .val(new Date(mealDate).asString());

        // This append *must* occur before the call to datePicker.
        grid_date_input.appendTo(grid_date);
        grid_date_anchor.appendTo(grid_date);
        grid_date_input.datePicker( { createButton: false, startDate: new Date(1990, 0, 1) } );
        grid_date_input.css({'display':'none'});
        grid_date_text.click(function() {
            grid_date_input.dpDisplay(grid_date);
        });
    
        grid_date_input.on('dateSelected', function(e, sdate, td, selected) {
            // Set the pop-up date
            $('#pop_date_text').html(sdate.asMyString());
    
            // Calculate the mealdate
            var md = MEALINFO.dateToMealDate(sdate, MEALINFO.mealToConst(meal.meal));
    
            // Update server side
            updateMealDateAjax(meal, md);
    
            return false;
        });

        return grid_date;
    }
    
    // Meal attributes / edit modal
    function showattributesmealinfo(username, meal, restaurant, restaurantId) {
    
        var username = meal.userid;
        var timestamp = meal.timestamp;
    
        // Create the popup div
        popup = $(dc('div'))
            .attr('id', 'mealAttributes')
            .attr('class', 'mealAttributesPopup')
            .css('z-index', '9999')
            .css('padding', '20px');
    
        // Center things on this popup.  
        var centr = $(dc('center'));
    
        // Carousel div
        var carouselDivContainer = $(dc('div'))
            .attr('id', 'mealCarouselContainer')
            .attr('class', 'mealCarouselContainer');
    
        // Create a carousel
        elm = createcarousel(username, 'pics', 
                meal.picInfo, findpicidx, meal.keytimestamp, adjustmaskfade,
                maxpicspermeal);
    
        // Append it to the div
        elm.appendTo(carouselDivContainer);
    
        // Append carousel to popup
        carouselDivContainer.appendTo(centr);
    
        // Create a container for the dismiss box
        var closexContainer = $(dc('div'))
            .attr('id', 'mealAttributesCloseContainer')
            .attr('class', 'mealAttributesCloseContainer');
    
        // Create an anchor for the dismiss box
        var closex = $(dc('a'))
            .attr('id', 'mealAttributesCloseButton')
            .attr('class', 'mealAttributesCloseButton')
            .html('x');
    
        // Click handler for dismiss box
        closex.click(function(){
            destroymodal();
        });
    
        // Append to popup
        closex.appendTo(closexContainer);
        closexContainer.appendTo(popup);
    
        // Append center to popup
        centr.appendTo(popup);
    
        // Create a class_8 container
        var class8 = $(dc('div'))
            .attr('id', 'mealAttributesClass8')
            .attr('class', 'container_8');
    
        // Hold objects directly beneath the carousel
        subcarousel = $(dc('div'))
            .attr('id', 'subcarousel')
            .attr('class', 'carousel_caption');

        // Create my upload anchor
        uploadanchor = createuploadanchor(meal);
    
        // Retrieve a delete anchor
        keyanchor = createkeyanchor(meal);
    
        // Create delete picture anchor
        deleteanchor = createdeleteanchor(meal);
    
        // Add to the carousel fadeobjs
        elm.fadeatzeropics(keyanchor.get(0));
    
        // Add to the carousel fade objects
        elm.fadeatzeropics(deleteanchor.get(0));

        // Add to the carousel fade objects
        elm.fadeatmaxpics(uploadanchor.get(0));
    
        // Clear 
        var carouselClear = $(dc('div'))
            .attr('class', 'clear');

        // Attach to popup
        uploadanchor.appendTo(subcarousel);
        keyanchor.appendTo(subcarousel);
        deleteanchor.appendTo(subcarousel);

        subcarousel.appendTo(class8);
        carouselClear.appendTo(class8);
    
        // Lets skip a line
        var skipLine = $(dc('div'))
            .attr('class', 'grid_8 skipline')
            .html('.');
        var skipClear = $(dc('div'))
            .attr('class', 'clear');
    
        skipLine.appendTo(class8);
        skipClear.appendTo(class8);
    
        // Create a grid to hold the title
        var grid_title_pre = $(dc('div'))
            .attr('class', 'grid_3')
            .html('Title');
    
        var title = "<i>Click to edit title</i>";
    
        if(undefined != meal.title && meal.title.length > 0) {
            title = meal.title;
        }
    
        var hovertitle = $(dc('a'))
            .attr('id', 'titleEdit')
            .attr('class', 'titleEdit')
            .attr('title', 'click to edit')
            .html(title);
    
        // Title grid
        var grid_title = $(dc('div'))
            .attr('class', 'grid_5')
            .attr('id', 'pop_title');
    
        hovertitle.appendTo(grid_title);
    
        hovertitle.click(function(){
    
            var titleEditInput = $(dc('input'))
                .attr('type', 'text')
                .attr('class', 'titleEditInput')
                .attr('name', 'titleEditInput')
                .attr('maxlength', '29')
                .attr('size', '29')
                .val(meal.title);
    
            titleEditInput.appendTo(grid_title);
            $('#titleEdit').css({'display':'none'});
    
            titleEditInput.focus();
    
            // Disable carosel arrow behavior
            elm.disablekeydown();
    
            function blurTitleInput(meal, titleEditInput, keepcurrent) {
                if(titleEditInput.val() != meal.title && keepcurrent == 0) {
    
                    var titleEdit; 

                    meal.title = titleEditInput.val();

                    // If this is empty
                    if(undefined == meal.title || meal.title.length <= 0) {

                        // Change modal title
                        $(hovertitle).html("<i>Click to edit title</i>");

                    }
                    else {

                        // Change modal title
                        $(hovertitle).html(meal.title);

                    }

                    // Change grid title
                    if(setgridtitle) {
                        setgridtitle(meal);
                    }
    
                    $.ajax({
                        url: '/savetitle',
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify(
                            {
                                username: meal.userid,
                                timestamp: meal.timestamp,
                                title: titleEditInput.val()
                            }),
                        dataType: 'json',
                        complete: function(resp, astat) {
                        }
                    });
                }

                // Change grid title css
                $(hovertitle).css({'display':'inline-block'});

                // Remove input box
                titleEditInput.remove();

                // Allow keyboard carousel control
                elm.enablekeydown();
            }
    
    
            // I want certain keys (return or tab) to force a blur
            titleEditInput.keydown(function(e){
                var code = (e.keyCode ? e.keyCode : e.which);
                switch(code) {
                    // XXX 
                    case 39:
                    case 37:
                        return true;
                        break;
                    case 13:
                    case 9:
                        titleEditInput.blur();
                        return false;
                        break;
                    case 27:
                        blurTitleInput(meal, titleEditInput, 1);
                        return false;
                        break;
                }
            });
    
            titleEditInput.blur(function() {
                    blurTitleInput(meal, titleEditInput, 0);
            });
        });
    
        var grid_title_clear = $(dc('div'))
            .attr('class', 'clear');
    
        // Append title
        grid_title_pre.appendTo(class8);
        grid_title.appendTo(class8);
        grid_title_clear.appendTo(class8);
    
        if(showdate) {
    
            // Create label column
            var grid_date_pre = $(dc('div'))
                .attr('class', 'grid_3')
                .html('Date');

            // Create grid-date
            var grid_date = makepopdate(meal);

            // Create clear-column
            var grid_date_clear = $(dc('div'))
                .attr('class', 'clear');

            grid_date_pre.appendTo(class8);
            grid_date.appendTo(class8);
            grid_date_clear.appendTo(class8);
    
        }

        if(showwhichmeal) {
        
            var whichmeal = meal.meal.charAt(0).toUpperCase() + meal.meal.slice(1);
        
            // Which meal
            var grid_meal_pre = $(dc('div'))
                .attr('class', 'grid_3')
                .html('Meal');
        
            var grid_meal = $(dc('div'))
                .attr('class', 'grid_5')
                .attr('id', 'pop_meal');
        
            // Create the which-meal selection menu
            var grid_meal_select_div = $(dc('div'))
                .attr('class', 'meal_select_menu_div')
                .attr('id', 'meal_select_menu_div')
                .css({'display': 'block'});
        
            var grid_meal_select = $(dc('ul'))
                .attr('class', 'meal_select_menu')
                .attr('id', 'meal_select_menu')
                .attr('name', 'meal_select_menu');
        
            // BREAKFAST
            var grid_meal_select_meal_breakfast = $(dc('li'))
                .attr('class', 'meal_select_menu_selection')
                .attr('name', 'meal_select_menu_breakfast')
                .attr('id', 'meal_select_menu_breakfast');
        
            var grid_meal_select_meal_breakfast_anchor = $(dc('a'))
                .attr('id', 'meal_select_breakfast_anchor')
                .attr('class', 'meal_select_anchor')
                .html('Breakfast');
        
            if(meal.meal == "breakfast") {
                grid_meal_select_meal_breakfast_anchor.attr('class', 'grid_meal_selected');
            }
            
            grid_meal_select_meal_breakfast_anchor.click(function() {
                if(meal.meal == "breakfast") {
                    return;
                }
                if(meal.meal == "lunch" ) {
                    grid_meal_select_meal_lunch_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "dinner" ) {
                    grid_meal_select_meal_dinner_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "snack" ) {
                    grid_meal_select_meal_snack_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "other" ) {
                    grid_meal_select_meal_other_anchor.removeClass('grid_meal_selected');
                }
                grid_meal_select_meal_breakfast_anchor.attr('class', 'grid_meal_selected');
                meal.meal = "breakfast";
                whichmeal = meal.meal.charAt(0).toUpperCase() + meal.meal.slice(1);
                grid_meal.html(whichmeal);
                updateMealAjax(meal, "breakfast");
                if(setgridmeal) setgridmeal(meal);
            });
        
            grid_meal_select_meal_breakfast_anchor.appendTo(grid_meal_select_meal_breakfast);
        
            // LUNCH
            var grid_meal_select_meal_lunch = $(dc('li'))
                .attr('class', 'meal_select_menu_selection')
                .attr('name', 'meal_select_menu_lunch')
                .attr('id', 'meal_select_menu_lunch');
        
            var grid_meal_select_meal_lunch_anchor = $(dc('a'))
                .attr('id', 'meal_select_lunch_anchor')
                .attr('class', 'meal_select_anchor')
                .html('Lunch');
            if(meal.meal == "lunch") {
                grid_meal_select_meal_lunch_anchor.attr('class', 'grid_meal_selected');
            }
            grid_meal_select_meal_lunch_anchor.click(function() {
                if(meal.meal == "lunch") {
                    return;
                }
                if(meal.meal == "breakfast" ) {
                    grid_meal_select_meal_breakfast_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "dinner" ) {
                    grid_meal_select_meal_dinner_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "snack" ) {
                    grid_meal_select_meal_snack_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "other" ) {
                    grid_meal_select_meal_other_anchor.removeClass('grid_meal_selected');
                }
                grid_meal_select_meal_lunch_anchor.attr('class', 'grid_meal_selected');
                meal.meal = "lunch";
                whichmeal = meal.meal.charAt(0).toUpperCase() + meal.meal.slice(1);
                grid_meal.html(whichmeal);
                updateMealAjax(meal, "lunch");
                if(setgridmeal) setgridmeal(meal);
            });
            grid_meal_select_meal_lunch_anchor.appendTo(grid_meal_select_meal_lunch);
        
            // DINNER
            var grid_meal_select_meal_dinner = $(dc('li'))
                .attr('class', 'meal_select_menu_selection')
                .attr('name', 'meal_select_menu_dinner')
                .attr('id', 'meal_select_menu_dinner');
            var grid_meal_select_meal_dinner_anchor = $(dc('a'))
                .attr('id', 'meal_select_dinner_anchor')
                .attr('class', 'meal_select_anchor')
                .html('Dinner');
            if(meal.meal == "dinner") {
                grid_meal_select_meal_dinner_anchor.attr('class', 'grid_meal_selected');
            }
            grid_meal_select_meal_dinner_anchor.click(function() {
                if(meal.meal == "dinner") {
                    return;
                }
                if(meal.meal == "breakfast" ) {
                    grid_meal_select_meal_breakfast_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "lunch" ) {
                    grid_meal_select_meal_lunch_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "snack" ) {
                    grid_meal_select_meal_snack_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "other" ) {
                    grid_meal_select_meal_other_anchor.removeClass('grid_meal_selected');
                }
                grid_meal_select_meal_dinner_anchor.attr('class', 'grid_meal_selected');
                meal.meal = "dinner";
                whichmeal = meal.meal.charAt(0).toUpperCase() + meal.meal.slice(1);
                grid_meal.html(whichmeal);
                updateMealAjax(meal, "dinner");
                if(setgridmeal) setgridmeal(meal);
            });
            grid_meal_select_meal_dinner_anchor.appendTo(grid_meal_select_meal_dinner);
        
            // SNACK
            var grid_meal_select_meal_snack = $(dc('li'))
                .attr('class', 'meal_select_menu_selection')
                .attr('name', 'meal_select_menu_snack')
                .attr('id', 'meal_select_menu_snack');
            var grid_meal_select_meal_snack_anchor = $(dc('a'))
                .attr('id', 'meal_select_snack_anchor')
                .attr('class', 'meal_select_anchor')
                .html('Snack');
            if(meal.meal == "snack") {
                grid_meal_select_meal_snack_anchor.attr('class', 'grid_meal_selected');
            }
            grid_meal_select_meal_snack_anchor.click(function() {
                if(meal.meal == "snack") {
                    return;
                }
                if(meal.meal == "breakfast" ) {
                    grid_meal_select_meal_breakfast_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "lunch" ) {
                    grid_meal_select_meal_lunch_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "dinner" ) {
                    grid_meal_select_meal_dinner_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "other" ) {
                    grid_meal_select_meal_other_anchor.removeClass('grid_meal_selected');
                }
                grid_meal_select_meal_snack_anchor.attr('class', 'grid_meal_selected');
                meal.meal = "snack";
                whichmeal = meal.meal.charAt(0).toUpperCase() + meal.meal.slice(1);
                grid_meal.html(whichmeal);
                updateMealAjax(meal, "snack");
                if(setgridmeal) setgridmeal(meal);
            });
            grid_meal_select_meal_snack_anchor.appendTo(grid_meal_select_meal_snack);
        
            var grid_meal_select_meal_other = $(dc('li'))
                .attr('class', 'meal_select_menu_selection')
                .attr('name', 'meal_select_menu_other')
                .attr('id', 'meal_select_menu_other');
            var grid_meal_select_meal_other_anchor = $(dc('a'))
                .attr('id', 'meal_select_other_anchor')
                .attr('class', 'meal_select_anchor')
                .html('Other');
            if(meal.meal == "other") {
                grid_meal_select_meal_other_anchor.attr('class', 'grid_meal_selected');
            }
            grid_meal_select_meal_other_anchor.click(function() {
                if(meal.meal == "other") {
                    return;
                }
                if(meal.meal == "breakfast" ) {
                    grid_meal_select_meal_breakfast_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "lunch" ) {
                    grid_meal_select_meal_lunch_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "dinner" ) {
                    grid_meal_select_meal_dinner_anchor.removeClass('grid_meal_selected');
                }
                if(meal.meal == "snack" ) {
                    grid_meal_select_meal_snack_anchor.removeClass('grid_meal_selected');
                }
                grid_meal_select_meal_other_anchor.attr('class', 'grid_meal_selected');
                meal.meal = "other";
                whichmeal = meal.meal.charAt(0).toUpperCase() + meal.meal.slice(1);
                grid_meal.html(whichmeal);
                updateMealAjax(meal, "other");
                if(setgridmeal) setgridmeal(meal); });
            grid_meal_select_meal_other_anchor.appendTo(grid_meal_select_meal_other);
        
            // build menu
            grid_meal_select_meal_breakfast.appendTo(grid_meal_select);
            grid_meal_select_meal_lunch.appendTo(grid_meal_select);
            grid_meal_select_meal_dinner.appendTo(grid_meal_select);
            grid_meal_select_meal_snack.appendTo(grid_meal_select);
            grid_meal_select_meal_other.appendTo(grid_meal_select);
            grid_meal_select.appendTo(grid_meal_select_div);

            var grid_meal_clear = $(dc('div'))
                .attr('class', 'clear');
        
            // Append meal
            grid_meal_pre.appendTo(class8);
            grid_meal.appendTo(class8);
            grid_meal_select_div.appendTo(class8);
            grid_meal_clear.appendTo(class8);
        }

        // XXX BEGIN RATING
        if(showrating) {
    
            // How many stars
            var grid_stars_pre = $(dc('div'))
                .attr('class', 'grid_3')
                .html('Rating');
    
            var grid_stars = makepoprating(meal);
        
            var grid_stars_clear = $(dc('div'))
                .attr('class', 'clear');
        
            // Append rating
            grid_stars_pre.appendTo(class8);
            grid_stars.appendTo(class8);
            grid_stars_clear.appendTo(class8);

        }
    
        // If there's a restaurant associated with this meal, link to it
        if(restaurantId > 0 && restaurant != undefined) {
        }
    
        if(showreview) {
    
            // If there's already a review, display it now
            var grid_review_pre = $(dc('div'))
                .attr('class', 'grid_3')
                .html('Blog');
        
            var review = "(click to edit blog)";
        
            var grid_review = $(dc('div'))
                .attr('class', 'grid_5')
                .attr('class', 'grid_review')
                .attr('id', 'pop_review')
                .attr('name', 'pop_review');
        
        
            if (meal.review != undefined && meal.review.length > 0) {
                review = meal.review;
            }
        
            var grid_review_textarea = $(dc('textarea'))
                .attr('class', 'review_noedit')
                .attr('class', 'review_text_area')
                .attr('id', 'review_text_int')
                .attr('cols', textareawidth)
                .attr('rows', 20)
                .attr('readonly',  true)
                .html(review);
        
            grid_review_textarea.click(function() {
        
                elm.disablekeydown();
        
                $('#review_text_int').removeClass('review_noedit');
                $('#review_text_int').addClass('review_edit');
                $('#review_text_int').attr('readonly', false);
        
                // Zap the not-reviewed placeholder
                if(meal.review == undefined || meal.review.length <= 0) {
                    //grid_review_textarea.html('');
                    $('#review_text_int').html('');
                }
            });
        
            grid_review_textarea.keydown(function(e){
                var code = (e.keyCode ? e.keyCode : e.which);
                switch(code) {
                    case 27:
                    case 9:
                        $('#review_text_int').blur();
                        return false;
                }
            });
        
            grid_review_textarea.blur(function() {
                var tmpText = $('#review_text_int').val();
                updateReviewAjax(meal, tmpText);
                if(tmpText == undefined || tmpText.length <= 0) {
                    $('#review_text_int').html('(click to edit review)');
                }
                meal.review = tmpText;
        
                $('#review_text_int').addClass('review_noedit');
                $('#review_text_int').removeClass('review_edit');
                $('#review_text_int').attr('readonly', true);
        
                elm.enablekeydown();
            });
            
            grid_review_textarea.appendTo(grid_review);
        
            var grid_review_clear = $(dc('div'))
                .attr('class', 'clear');
        
            grid_review_pre.appendTo(class8);
            grid_review.appendTo(class8);
            grid_review_clear.appendTo(class8);
        }
    
        if(showdelete) {

            var deleteLink = $(dc('div'))
                .attr('class', 'grid_8 delete_link')
                .attr('id', 'delete_link');
        
            var deleteMealAnchor = $(dc('a'))
                .attr('class', 'delete_link_anchor')
                .attr('id', 'delete_link_anchor')
                .attr('href', 'javascript:void(0)')
                .attr('title', 'Delete')
                .html('<i>Click to Delete Meal</i>');
        
            var deleteClear = $(dc('div'))
                .attr('class', 'clear');
        
            deleteMealAnchor.click(function() {

                function deleteanddestroy() {

                    destroymodal(false);

                    if(griddelete) {

                        griddelete(meal);
                    }
                }

                if(promptdeletemeal) {
                    if(usesimpleprompt) {
                        var answer = confirm("Delete this meal and all pictures?");
                        if(answer) {
                            deleteanddestroy();
                        }
                    }
                    else {

                        var dmprompt = createdeletemealprompt(
                            function() {
                                deleteanddestroy();
                                $.unblockUI();
                            },
                            function() {
                                $.unblockUI();
                            },
                            function() {
                                promptdeletemeal = false;
                                deleteanddestroy();
                                $.unblockUI();
                            }
                        );
    
                        $.blockUI({message: dmprompt});
                    }
                }
                else {
                    deleteanddestroy();
                }
    
            });
        
            deleteMealAnchor.appendTo(deleteLink);
        
            // Append to modal
            // deletePre.appendTo(class8);
            deleteLink.appendTo(class8);
            deleteClear.appendTo(class8);

        }
    
        class8.appendTo(popup);

        // Display background
        //showmaskfade();
       
        // Wait for the first carousel image to load
        elm.loadcarousel(function(alen) {

            positionmodal();


            if(appendpop) {
                popup.appendTo(appendpop);
            }
            else {
                popup.appendTo('body');
            }


            popup.fadeIn({ queue: true, duration: 500 });

            // Display background
            showmaskfade();

        });
    }

    // Getter for the showattributes gridobject
    function getgridobj() {

        return gridobj;

    }

    // Setter for the showattributes gridobject
    function setgridobj(griddiv) {

        gridobj = griddiv;

    }

    function show(username, timestamp, griddiv) {

        if(isshowing) {
            return false;
        }

        isshowing = true;

        // Latch griddiv immediately
        if(griddiv) {
            gridobj = griddiv;
        }
        else {
            gridobj = null;
        }

        $.getJSON('/ajaxgetmealinfo',
            {
                username: username,
                timestamp: timestamp
            },
            function(response) {
                if(response.errStr != undefined && response.errStr.length > 0) {
                    if(response.errStr == "signin") {
                        window.location.replace("/signin");
                    }
                    if(response.errStr == "wronguser") {
                        window.location.replace("/");
                    }
                    // TODO - draw an elegant page for this case
                    // TODO - elegant handling of all error - maybe have a box at the box
                    // which informs the user if/when this occurs
                    if(response.errStr == "nomeal") {
                        window.location.replace("/");
                    }
                }
                else {
                    if(griddiv) {
                        response.mealInfo.gridobj = griddiv;
                    }
                    showattributesmealinfo(username, response.mealInfo, 
                            response.restaurantInfo, response.restaurantId);
                }
            }
        );
    }

    // Must init before using
    function init(findp, makecarousel, cfg) {

        // Shorten function name
        cfg.hp = cfg.hasOwnProperty;

        // Set search function
        findpicidx = findp;

        // Set the create carousel function
        createcarousel = makecarousel;

        // Minimum mask width
        minmaskfadewidth = cfg.hp("minmaskfadewidth") ? cfg.minmaskfadewidth : 1024;
    
        // Maximum picture height
        maxpicheight = cfg.hp("maxpicheight") ? cfg.maxpicheight : 780;

        // Opacity
        maskfadeopacity = cfg.hp("maskfadeopacity") ? cfg.maskfadeopacity : 0.6;
    
        // Where to append the 
        appendpop = cfg.hp("appendpop") ? cfg.appendpop : null;
    
        // Width of modal
        modalwidth = cfg.hp("modalwidth") ? cfg.modalwidth : 800;
    
        // Hidden frame
        hiddenframe = cfg.hp("hiddenframe") ? cfg.hiddenframe : $('#hiddenElements')[0];
    
        // Grid delete function
        griddelete = cfg.hp("griddelete") ? cfg.griddelete : null;
    
        // Set the display picture
        setgriddisplay = cfg.hp("setgriddisplay") ? cfg.setgriddisplay : null;
    
        // Set the grid title
        setgridtitle = cfg.hp("setgridtitle") ? cfg.setgridtitle : null;
    
        // Set the update count function
        setgridcount = cfg.hp("setgridcount") ? cfg.setgridcount : null;
    
        // Set the meal on the grid
        setgridmeal = cfg.hp("setgridmeal") ? cfg.setgridmeal : null;

        // Set the show calendar 
        showdate = cfg.hp("showdate") ? cfg.showdate : false;

        // Set the rating
        showrating = cfg.hp("showrating") ? cfg.showrating : false;

        // Set showwhichmeal
        showwhichmeal = cfg.hp("showwhichmeal") ? cfg.showwhichmeal : false;

        // Set the showreview
        showreview = cfg.hp("showreview") ? cfg.showreview : true;

        // Set the showdelete
        showdelete = cfg.hp("showdelete") ? cfg.showdelete : true;

        // Bottom margin for maskfade
        maskfadebottommargin = cfg.hp("maskfadebottommargin") ? 
            cfg.maskfadebottommargin : 30;
        
        // Prompt the user when they delete a meal
        promptdeletemeal = cfg.hp("promptdeletemeal") ? 
            cfg.promptdeletemeal : true;

        // Prompt the user when they delete a carousel picture
        promptdeletepic = cfg.hp("promptdeletepic") ? 
            cfg.promptdeletepic : true;

        // Use simple prompts
        usesimpleprompt = cfg.hp("usesimpleprompt") ? 
            cfg.usesimpleprompt : false;

        // Show the dont prompt option
        showdontprompt = cfg.hp("showdontprompt") ?
            cfg.showdontprompt : false;

        // Popup button width
        popupbuttonwidth = cfg.hp("popupbuttonwidth") ? 
            cfg.popupbuttonwidth : 100;

        // Button margins
        buttonmargin = cfg.hp("buttonmargin") ? 
            cfg.buttonmargin : 20;
        
        maxpicspermeal = cfg.hp("maxpicspermeal") ? 
            cfg.maxpicspermeal : 64;

        // We are not showing
        isshowing = false;

        // Element creator
        dc = cfg.hp("createelm") ? cfg.createelm : function(a) {
            return document.createElement(a);
        }
    
        // Keep track of the window's width
        windowwidth = $(window).width();
    
        // Keep track of the window's height
        windowheight = $(window).height();

        // Create the background for this
        maskfade = $(dc('div'))
            .attr('id', 'maskfade')
            .attr('class', 'maskclass')
            .css({'display':'none'})
            .appendTo('body');
    
        // Click handler for background
        maskfade.click(function() {
    
            destroymodal();
    
        });
    }

    return {
        init                        : init,
        show                        : show,
        setgridobj                  : setgridobj,
        getgridobj                  : getgridobj,
        destroy                     : destroymodal,
        setgriddeletecallback       : setgriddeletecallback,
        setgriddisplaycallback      : setgriddisplaycallback,
        setgridcountcallback        : setgridcountcallback,
        setgridtitlecallback        : setgridtitlecallback,
        setgridmealcallback         : setgridmealcallback,
        modalisshowing              : modalisshowing,
    };

}(jQuery));

