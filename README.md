mylunch
=======
* Personal project: a website where people can upload pictures of their meals.

todo
====

* I will put a box with rounded corners behind the grid maybe.  The grid
  itself should be a little configureable: you pass in how many pictures
  you want displayed per row based on the size of the monitor.  So the
  'numpics-per-page' metric is driven by the size of the user's monitor.
  I'm not sure this should be configurable.  The javascript on the client
  side can figure out the optimum number of rows and columns, and can 
  determine how many meals to request in a 'mealinfo' request.  The
  modal will remain the same.

* Make 'thegrid' more formalized & self contained.  This page should have
  banners, menus, etc.  Not sure what will be in them, but they should be
  there .. 

* Revise the editmeals page - think hard about how you want this to look.  
  You know the info you'll be displaying.

* Animate the resizing of the carousel maybe (not sure if this is a priority)

* Maybe add a background design to the carousel so that the large-to-small
  picture affect will be softened ..

* Instead of relying on jquery finds, keep a golden copy of a single find in
  the elm object - maybe hold on this unless its a performance issue

* For the links below the carousel: put a direct reference to the into the 
  carousel itself .. maybe generalize it a bit.

* Maybe make carousel rotatetopicture a general purpose thing?  Not sure if 
  i'll use it but this is not a terrible idea.

* Make the pictures on the editmeals page more even

* I'll need to revise the mongo access routines for 'getMealInfoFromMongoFwd'
  and 'getMealInfoFromMongoRev'.  The scheme now is not scalable, and not 
  efficient.  The problem is that I cannot use 'limit', so the database could
  end up doing a substantial amount of extra work.  I think I can do 
  something like this:

      ( mealDate == X && timestamp >= Y ) || ( mealDate > X )
      ( mealDate == X && timestamp <= Y ) || ( mealDate < Y )

* I'm on the rotate pictures function.  Maybe it would be better to show a 
  stack of meal photos & only rotate when the user clicks?  I'll have to 
  think about this.
* Next step (tomorrow morning) - go server side and create the mongo routines 
  for creating, and finding restaurants.

* Revise the way that meals are added:
    * Right now there's a one-to-one relationship between a photo and a review.
    * Users might want to have a review of a meal without a photo, or multiple
    photos in a single review.
    * So 'add-meal' on the edit meals page should pop-up immediately - on the
    modality that pops up, there should be a calendar widget, and 'add photo'
    button (that you can press multiple times to upload).  Also, each photo 
    will have a 'delete-photo' beneath it.
    * The order of the photos on the editmeals page is now different- and if
    there are multiple photos for a single meal, I'm going to stack the
    thumbs.
    * 'mealinfo' is going to have to change - the 'mealinfo' can now have 
    multiple photos.  Maybe create a 'photo-info' table, and take the photo-
    specific stuff out of mealinfo.
    * Each 'mealinfo' is tagged with a unique id (creation time).  Each photo
    is tagged with its own time, and a reference to the mealinfo.

* Come up with the data format for my local-restaurants.  I want to relate it
  to the user somehow.
  The SIMPLEST programatically is to make it a first-class entity in the 
  restaurants table.  I'm just going to do that..

* Google & local suggestions should be two asynchronous calls the last one 
  finished should call autosuggest with 'predictions'.  Each predictions 
  element should have a 'description' and 
 
    matched_substrings[0].offset 
    matched_substrings[0].length
 
    matched_substrings is an array, but I only care about the 0'th element.
 
  Both the google-request and the local matching code should run 
  asynchronously (and both with timeouts somehow!!).  The last finished (or 
  the last timed out) should call the 'autosuggest' routine.
 
  After the box is filled, all of the processing will be done via an ajax 
  request on the backend.  The only difference between a google-suggestion and 
  a local-suggestion is that the local-suggestion will have the restaurantid 
  directly, whereas the google-suggestion will have to hash into it.

  My autosuggestions: I could go one of two ways: Simple: these could only 
  contain 'local' restaurants.  Difficult: these could ALSO contain the last 
  100 'global' restaurants that the user has visited.  If it does, then
  I'll have to search for dups in the google-list and splice them out.

  Day 1: go with the simple.

  Also, the code which accepts uploads should SEND BACK the pictures GPS 
  coordinates somehow to see google's autocomplete.

* Ok - all of my global restaurants will have a google-id.  This could be an 
  index.  Here's my problem:

  - Making the entire name a key is not efficient!
  - So I HASH it to come up with a non-unique key, although I'd expect 
    collisions to be rare.
  - Yes .. this is it

* Brainstorm pretty much done- here's a list of things that should happen in
  no particular order:

* I'm taking some time today to research what a 'well designed' website should
  look like.  I'm seeing that alot of designers use 'wordpress' - this is an 
  apache / php solution.  There are ways to run php in node.js, but they're 
  not very good.  Node.js seems incredibly secure when compared to a 'search-
  directory-for-html' files solution.  There's prolly a way to white-list
  apache.

* Ok- some thoughts about the look and feel (design) of this - since I'm doing 
  ALL of it, I have to wear a lot of different hats.

  - Go through lots of pictures that I have of food, and select one.  This could
    be a close-up - crop off the sides, so that it's an extreme closeup (you'll
    have to think a bit before you realize that it's a sandwich, or whatever).
    This is the background .. 


* Some thoughts on design - this is still a brainstorm:
  - Each user and each restaurant will have a list of followers.  There are 
    a few types of globals:

    @global_restaurant

    username@local_or_global_restaurant
    username

    I could add both 'global_restaurant' and 'username@local' to the same
    restaurant table.  If something isn't found in google, then it's 
    automatically created as a 'username@local'

    So 'username@global' and 'username' subscriptions could then both be hung
    off of the user record.

    Alternatively, I could make all of the 'username' and 'username@' 
    subscriptions user attributes, and have a separate 'global_restaurant' 
    table.

    People can choose to follow any of these.  The global-restaurant
    structure is fairly easy: I'm going to change my userid scheme to be a 
    username (rather than an email).   

    - Keep a table (list) of followers for each global restaurant hung off
      of the global restaurant db entry.

    - Keep a table of followers for each user which will filter by 
      restaurant.  Filtering on a user is better than filtering on a rest-
      aurant because a single user will be posting much less.

    - The notification mechanism should never be done inline- I'll hand 
      this off to a thread or to a server.  And I don't think that I'd care
      about notifying node.js when it's finished (but could always implement
      that anyway just in case I decide otherwise).

    - Global rooms autocomplete successfully via google - anything which 
      autocompletes creates a global-room rather than a local room.

    - All of a client's local restaurants are sent to the client website to 
      partcipate in the autocomplete there.  I will put a cap on the number of
      local rooms that a client can have to keep this reasonable.  I think 
      256 or 512 are pretty reasonable numbers, and these should be fairly
      quick to load.  As for this, make sure that you review the docs you 
      have- reread the 'building fast client-side searches' document.  The
      trick is that you load a dynamically generated javascript file, or you
      use the javascript 'split' command with a custom string format (which 
      records delineated by control characters).

    - Redo the signup page such that a user will have to find a unique 
      username.  I will have a CAPTCHA test built into this from the get-
      go.  A possibly better method is to load the form from an ajax
      request.  I'm sure that most bots are trying to parse html, not 
      javascript.  Include this as a honeypot: make sure that the text-box
      in question is toggled to 'hidden=yes' somewhere deep in javascript.  I
      should be able to avoid lots of bots this way.

* I have a couple of decisions to make at this point:
  - How am I going to seamlessly interleave personal meals with meals
    that were eaten at restaurants?  This is where things get a little hairy.
    If you give people the ability to follow 'places' rather than other 
    people you run the risk of offending the owners of those places.
  - Maybe have a very strict 'do not offend' policy, and throw out people 
    who violate this.  I could make complaining very very easy.
  - YES - I would have to do this anyway - I do NOT want people advertising, 
  - Will I allow users to follow other users 'twitter' style, or will i have 
    a concept of myspace friends?  Maybe I could allow users to follow either
    restaurants OR other users .. ?  So any picture uploaded to a restaurant
    would be sent to the user, and any picture uploaded by a user would be 
    sent to a user.
  - I'm leaning towards this route- the only negative is that I'll have to
    force people to pick usernames so that i don't accidentally disclose 
    someone's email address.  Forcing people to pick usernames is dumb, but
    everyone is used to it at least.
  - This becomes better though if I allow someone to sign in with either a
    username or a password.
  - Another concept - any place with is not found by google automatically be-
    comes a new and unique place which is prefaced by the creating user's 
    username.  So 'mykitchen@georgiagirl' would be an example.  Other users
    could subscribe to it, np.
  - Maybe EVERYTHING should be suffix'd by the user's name, and maybe there 
    should be no concept of a global 'restaurant' .. this seems better and
    safer somehow...  for one thing, i don't have to worry about restaurants 
    suing me, and i don't have to prescreen the photos.  I'm liking this a 
    bit more.  I could still allow people to subscribe to all of the photos
    from a single restaurant i think so long as they're using some kind of
    'wildcard' notation rather than giving the restaurant a designated page.
  - This means that I would allow people to subscribe to ALL olive garden 
    restaurant locations rather than just one that's tied to a certain
    address.  So someone could subscribe to *olive_garden*, or could search
    on all 'olive_garden' restaurants.
  - I want this to happen - this is good.
  - So .. im not sure about something - should I allow a subscriber to sub-
    scribe to all 'my_kitchens'?
  - I think that I have to limit the number of subscriptions a user has - so
    yes: someone can search for all 'my_kitchen' restaurants, but they'll 
    have to add each of the subscriptions individually.
  - The problem with wildcard subscriptions is that a person could subscribe
    to '*', and get EVERYTHING .. I don't think this is scalable.
  - I could limit the number of subscriptions a person has (so if they want to
    subscribe to all 'Olive Garden' restaurants, they'll have to add each of 
    them individually).  Or I could allow wildcards and limit the number of 
    updates per hour.
  - I think the answer is to force people to add things individually, and to 
    limit the number of subscriptions to something ridiculously high: 1000.
    Who would want to monitor more than 1000 restaurants?  Who would want to 
    monitor more than 1000 other users?
  - For delivery to subscribed folks I could use cell-phones or email: either
    or both would have to have an authentication proceedure.
  - You should be able to browse really interesting meals, and choose to 
    follow either a user or a restaurant.
  - The 'wildcard' subscription idea is interesting actually - it would be
    cool if i could allow people to subscribe to 'steaks' or to 'corn', and
    then every picture of steak or corn would be forwarded to them.
  - Realistically, this would be too much traffic - a person would get too
    many updates.  But I COULD allow someone to SEARCH on this .. and that
    would actually be fantastic.  I would have to store lots of meta-info 
    about each picture.
  - What would be really great is if I could write a piece of software which
    could take a picture and decode its contents .. this is a little pie-in-
    the-sky though right now - in 30 years it might be feasible.
* The winner is: google places api!  Their autocomplete engine is fantastic.
  I'll have to think about capturing the search results and maintaining a
  separate entry in my own database to provide a 'restaurant page'.  At first
  I was thinking that this should be restricted to what's on a list or in a 
  database, but now I think it should be completely open: if a user references
  a restaurant which doesn't exist, the website should automatically create a 
  new restaurant page for it.
* YES!  this is it.  see references/building fast client side searches.
  every keystroke can result in a new selection being sent from the server
  to the browser.  The user's results can be tailored to suit them: that is,
  if we know the users home address, or where the request is being made from,
  the resulting list of restaurants can be tailored to that.
* Issue: the output of the google search results might change but luckily each
  has a unique identifier included with that?  I understand that I'm going to be
  married to Google, but I'm okay with that: their policies are exactly right
  for me (very permissive until I get 100,000 hits a day- I'll be very happy
  when that day comes..)
* Maybe peridically we could the user if a non-google restaurant page is 'one 
  of the following' google-id webpages - make sure to do this only once per
  new restaurant (or not at all because its annoying).
* The advantage of choosing one of the pop-down menu options might be that the
  location will automatically show on a map on the editmeals popup.  I'll have
  to think about this.
fairly solid stuff:
* The signup page should request more of the user's information- like maybe
  their address, phone number, etc - this is crucial for selecting 
  autocomplete results.
* I will have to come up with a data format for this.
* Optimize the 'first-page-upload' case - you only have to wait for the
  timestamp of the upload .. you can shift everything down & derive nextpage
  from the picture that was shifted off.
* Tag each photo with its upload date and possiby show the range at the top 
  of the screen.
* Impement the trashcan: 
  Anything in the trashcan will stay until the user purges it, or until
  they run out of space.  So if they add a picture, and there are pics in 
  the trashcan, and (num-deleted + num-undeleted) > maxpics, mylunch should
  delete the oldest trashcan victim.
* Maybe there are other ways of viewing picures- like 'only lunches'.  Maybe
  even have them tied to an event?  Will have to think about this.
* Maybe having a trashcan is a mistake.  Another way to go is to make this an
  'admin-only' utility.  Administrators will be able to restore pictures that
  are less than x-weeks old.  In this scenario, there would still have to be
  a cap on the number deleted photos, or we become very vulnerable to a dos
  attack where a user adds and deletes a lot of photos.
* Maybe have views or buckets .. you might want to allow a user to create
  a category, and then assign pictures to that category.  I don't think 
  I like this.
* Maybe the only view that matters is meal origin, or restaurant.
* Restaurant page/Restaurant-id/etc.  You're gonna have to think hard
  about what you want this to look like.  User pictures and user reviews are
  everything here.  Make the user experience pleasant.. and FUN!
* Maybe put a cap on the number of pictures allowed per restaurant?  I'm not
  sure .. some people eat at the same places everyday - they might also 
  be like me and upload pictures for each of their meals.
* Possibly there might be a way to describe each food .. 


things to consider
==================
* I need a solid, convincing way to add a restaurant.. one possibility is
  to ask the restaurant owners to fill in the info.. maybe another idea is
  to make this part of the user experience.. they can 'create a restaurant' 
  page.
* I could data-mine whitepages, or other websites to pick up the information.
  The problem is that the quality of the information might be suspect.
* Possibly I could do a combination of both.
* Is this available for global viewing (user's decision)
* Is this available for global viewing (my decision)

advertisers index
=================
* An indexable unique-id for the user for quick-lookup.
    - create a js seed generator
    - or maybe just use the user's email

