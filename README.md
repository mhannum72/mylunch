mylunch
=======
* Personal project: a website where people can upload pictures of their meals.

todo
====

* I can't saturate a CPU on the server side .. this disturbs me, actually:
  seeing as I shouldn't ever be waiting on I/O (right?  Right??), I should be
  able to consume a cpu by adding load.  Instead what's happeneing is that I'm
  only using about 10% cpu no matter how much load I throw at it.

* I'm reading that I can use something call 'commet requests' to update my 
  webpage.  It looks like this is just an outstanding ajax request: the server 
  sends a response with information / instructions, and the client sends 
  another request.

* Unpublish / timeout
  1 X unpublishes a meal or the unpublish deamon sees the timeout
  2 All of the live web-sessions are updated (the link is removed)
    - The meal is removed from user's 'walls' if they are viewing that
    - The meal is removed from all 'this-users-meals' walls
  3 Delete all of the 'publish-id-timestamp' records.
  4 Mark each picture as 'unpublished'
  5 Mark the meal as 'unpublished'
  6 If someone manages to click a link anyway display a 'this meal has been 
    unpublished' modal.

* Walk through 'meal-publish' or 'meal-publish-with-timeout':
  1 X publishes a meal and is assigned a 'publish-id-timestamp'
  2 The meal entry is updated with an 'unpublish-at-time' (for the unpublish deamon)
  3 Each of the meal's pictures are labeled as 'world-viewable'
  4 A record for each of X's followers is inserted in the database
  5 Live web sessions are updated: this might be difficult-ish
  6 Users that want texts / etc are updated (i think this is easier)

  So long as a meal is 'published', the author cannot change it.  Instead they'll
  have to 'unpublish', change, and then 'republish'.  The republish will generate
  a new publish-timestamp.

  People will be able to view these meals in the carousel by clicking on them as 
  they appear on the page.  

* I'll have to set a maximum number of folks that a user can follow.  That'll 
  probably be pretty high though.

* A better model might be the 'push-to-followers' model.  If user X publishes
  a meal, a record containing this meal is pushed to all of user X's followers.

  The records have this layout:
  {
     followerid;
     publishtimestamp;
     timestampofmeal;
     creatorid;
     hasbeenviewed;
  }

  There will be an index on (followerid+publishtimestamp) to allow for quick and
  easy lookups.  There will also be an index on (creatorid+timestampofmeal) to
  allow for quick and easy 

  Both 'timeout' and 'unpublish' will utilize the same mechanism - it makes me 
  a little nervious that this will be alot of server-side logic.

  I will also let folks view the 'published meals of X'.

* A user is following 10 people.  On the 'most recent' page I want to show the
  most recent slideshows published by those 10 people.  This seems like it 
  would be incredibly expensive to calculate in real-time.

* Another thing I want: I want to know whether or not a person has viewed a 
  slideshow. 

* If a user is viewing a meal which has been unpublished then I would like that
  to disappear also - maybe there will be a 'This meal has been unpublished', 
  or a 'This meal has been timed-out' modal informing the user of what's 
  happened.

* So here's the rub: i would rather not display a stale link.  I would like to
  find a way to remove a link from a user's stream if it should be unpublished
  or if it should time out.  This should be possible.

* Users will need to 'sign-in' to see what meals they are allowed to see.  
  So there will be a page (in reverse order of time) of friends meals.  

* I think I have it: 
  I want to do 'timed publishing'.  This allows user to publish a meal for a 
  period of days, hours, or forever.  After the time expires, then the meal 
  will go back to 'private'.

* The other idea is that I could turn this into a game .. facebook is a game
  of sorts: people want to have the most 'friends'.  This game could be about 
  accruing the most viewed meals.

* Alternatively I could simply make everything public, and ask people to send
  invitations out via email.  You are building a slideshow with this .. it's 
  less interactive than simply posting random stuff to a wall.

* Okay .. so I will have 'share-with-friends', 'share-with-everyone', and 
  'make private'.  I could even support a 'timed-share' which would allow the
  meal to be available for a period of time before going 'private'.

* Creating things this way sort of stinks .. the quicker approach is the 'wall'
  approach.

* Rather than 'publish', maybe it would be better to have a simple 'share a 
  meal' link on the meal popup.  

* Maybe now I should start working on the 'friend management' page.  The 
  icons can persist, but not as part of a banner (the way they are now).  They
  should be alone, and flat (unless you hover).  And maybe captioned.

* I'm wondering if making everything happen on the editmeals page is a great
  idea .. I think that it makes things feel a little too much like a contained
  system, or a video game.  So I'm not sure about the icons at the top.

* I've been thinking that the 'users' database should be different from the 
  'pictures' database .. I'll want the 'users' database available everywhere.
  It's something that I expect will have a very high read-rate, but a very 
  low write rate.  The 'mongo cluster' might work for this.

* Should I keep the large images around?  Maybe.. this means I should 
  also keep the original filename around.  This is scary in that it will
  take up a ton of disk space.  But I think I should do it.

* After you publish a meal, the web server can keep track of the number 
  of people who have viewed it.  Or maybe people can 'like' it .. ?

* "Popular public meals"

* "What your friends are eating"

* "For the love of food!", family and good times.

* Wait .. I know the list of friends for any user on any given node.  I think 
  I could just cache these in memcache and time them out every few minutes ..

* 'Friends' is tougher .. this could be constantly changing .. so there could
  be a difference between the set of 'friends' at time X and current friends.
  Caching the id's of friends in each picture will cause lots of bloat.  I'm 
  going to have to have an extra lookup for the 'friends'.  I'm not sure if 
  this should work at this level (the 'get a picture' level).

* 'Public' is easy .. 

* Much as i hate normalization, a little bit of it is in order .. and this
  will slow things down unfortunately ..

* So how do I shard this .. ? 

* I will simplify and just have 'publish to world', and 'publish to 
  friends'.  A 'friendlist' is just a list of numbers in a database.  I 
  would like the friendlist to stay sorted by id .. so this might be a 
  record: (userid+friendid) with an index on this.  If a is friend to b, 
  then both 'a+b' and 'b+a' should be in this table.  So yes - I'll have
  friend requests via email, etc.  

* I want a clever way to share these slideshows .. now I'm thinking that I 
  could have several levels of publishing: I could allow it to be completely
  public, I could allow it to be published to only 'friends', or I could allow
  it to be published to a list of people who may or may not be 'friends'.

* The images seem to flicker as they scroll onto the editmeals page - this
  is probably only an issue for the LINUX version of firefox .. I will 
  need to make sure and test other browsers on other machines to make sure 
  this isn't an issue .. another approach might be to wait and apply the 
  grayscale affect after the grid has moved in place ..

* Fix the algorithm for choosing a user's name.

* The pictures are being written through to disk.  There might be an issue
  with scaling the redis cache (which is single threaded).

* Maybe each picture can have a descriptor file which contains the meta-
  information?

* Step 1 in implementing this: I have move some meta information into the
  picinfo table.  The downside to this is that it will take either two
  database hits, or a db hit and a fs hit .. this is the argument for 
  putting picture information in the header.  The argument against: I'd 
  like to be able to open these pictures up from the filesystem itself.

* Thought about going to mysql & decided against it.  I will still use
  mongo for the small stuff (user records, stuff that can stay in-memory)
  and the other stuff I will write to a file from within node itself
  (cut 1).  This may eventually become a server, but not today.

* This makes sense .. I'm going to do it.  The database records should 
  contain the path to the pictures.

* Ok .. I think I have a plan:  I'm going to stay with mongo to store the
  user data (it works fine).  This is just a dumb key-value store.  I can 
  write my own blindingly fast cache .. or even better, I can just store 
  these as files on the fs .. now here's the interesting part: I can 
  create a clusters of machines which handle a set of users.  So a local
  mongo might contain information for (say) 10k users, and a file system
  on that local machine would have all of the necessary photos, thumbs,
  etc, that these users use.

* Today all of the pictures are kept in mongodb- knowing what I now know 
  about mongo, this is a very bad design because despite being webscale, mongo
  doesn't scale: it's a memory mapped file that uses the machine's virtual 
  memory system as it's buffer-cache.  This means that it will happily
  consume all of your machines memory if you let it.  Mongo issue number 2:
  lock granularity: they have a single lock per collection (table) that they
  lock in read-mode for reads, write-mode for writes.  Whoever thought mongo
  was 'webscale' is seriously dumb.

* I don't have to throw all of this away necessarily (though I might 
  eventually).  If I consider mongodb to be simply a small-ish in-memory hash
  which contains the meta-information about the pictures then I'm golden.

* For the pictures themselves, I'll access them directly from the file-system.
  My plan is to create a small-ish server which will handle the replication of
  the image files across different machines.  My web-server should make all 
  read and write requests through this server.

* All of the pictures should be stored in redis (with a refreshing timeout)
  and onto disk.  There's a little bit of meta-information that I'll want to 
  store in a header here.

* Cut 1: this will be very simple, local machine only.  Maybe it uses redis
  or memcached 

* If I stay with mongo, I will have to revisit the implementation and 
  revise my deployment strategies ..

* Mongodb has COLLECTION-LEVEL-LOCKING.  This is pretty terrible.  Maybe
  each user could get their own collection?  How fast is it to resolve
  a collection for a user?  I guess I could 'cache' the collection-
  handle ..

* I'm thinking that Cassandra might be the right product, but I'll have to
  take care to configure it correctly.  I will have to make sure I have the
  'timeout' feature turned off .. and I'll have to have a sane way to 
  partition the data (I think the default random algorithm is sub-optimal).

* (sigh) I think I'm going to have to replace the backend.  Maybe there's 
  another nosql solution?  Or I'm not opposed to using a normal database.

* Mongodb might not be what I want.   The 2Gb / 32-bit limitation tells me 
  that all of my data has to live in memory.  I don't think this even 
  qualifies as a database.  It's a datastructure that you can query fast.

* Here's what would be cool: when you type stuff into a search bar it displays
  a menu of autocomplete selections.  What would be cool is if the selected 
  mealthumb(s) would pop-up as you press the down-key.

* There must be an easy way to search on the meal's title or other fields.
  Sometimes I'd like to easily pull up something that I ate a while ago, 
  and I've forgotten about it.  Akshat tells me that lucene does exactly this
  pretty well- opengrok, the java-based 'wicked-fast' source browser uses 
  lucene.

* Update mongodb to 64-bit

* Maybe make a trash-can one of the icons on the top of the screen - users 
  will be able to restore deleted pictures and meals from the trash can.

* Work on the 'User Preferences' screen.  This should have very basic things:

  Logout
  Update Email Address (heavy-weight .. )
  Update Password
  Update Name
  Update Address
  Buy More Space (Maybe?)

* Wait - the title-bar looks OKAY if I have two rows rather than one..

* Lunch-meat or Lunch-meet .. there's something there ..

* Maybe add a 'click to edit' message on top of the new meal icon that will 
  appear after the fade-in.

* Order of operations:

* Do the title bar first.  This will lead you into a few other pages.

* An even easier project: the 'no meal' text

* An easier project: captions for photos!  This would be hella simple, and
  hella-fun.  I would just add a caption field to the picinfo structure I 
  have ..

* Maybe give users the option of 'publishing' or 'unpublishing'.  
  - Published meals will be available for others to view.  People who are 
    following you will then be able to view it.  You can additionally send out
    invitations for folks to look at what you ate.

  - A published meal can't be modified or deleted until it is unpublished

  - There will need to be a protocol for users who are viewing meals which
    then become unpublished.   I'm not sure how to do this gracefully.

* You'll have to place limits on the number of meals and the number of pictures
  that a user can have.

* It looks like inkscape is the svg editor you'll want to use .. 

* There could be an additional menu up top with drop-down items .. i don't know
  if i like drop-down anymore.

* Imagine that this was really simple: there are 4 headings:

  Home
  Editmeals
  About
  Contact

  Maybe implement this much

* Maybe when the user is editing, the 'edit' icon could be bigger, or
  have the words 'Edit Meals' written over it.

* I just want to get something out of the door .. keep it simple for now.  
  Worry about magazine-cover homepages, etc, later.

* TODAY: fix the attributes popup (finally).  Start on the 'share-a-meal'
  functionality.

* Imagine I had everything in place, and then I started publicizing this,
  or if I created a publicity stunt that would feature me on lots of 
  news stations, etc.

* Let's talk about the home page: this could be like a magazine cover.
  It will feature the meal-of-the-day prominently (possibly as a back
  ground image) and then have other 'interesting' things:

  Most active users
  Top 10 most interesting meals
  Submit a picture / meal to be considered for the most interesting meal
  Enter to win a meal at a local restaurant (by featuring that restaurant 
  on your mealpage)
  Contact myLunch!

* On the home page: 
  most active users
  most interesting pictures
  slideshows 
  meal of the day 
  free-lunch-giveaway 
  lunch-money-sweepstakes
  Partners-coupons for people who feature restaurants on their mealpage
  It should have the 'meal-of-the-day' picture featured
  share-a-meal: links to city-meals-on-wheels, city-harvest, and other
  food related charities.  And a big message that says we'll be giving a
  portion of our profits to these charities, or saying that we are 
  proud sponsers of these charities.
  Maybe the sweepstakes can be charity related?

* What are the categories?
  Home
  Editmeals
  Donate
  About
  Order

* Create the charity page.

* Possibly I should store the actual image as well as the resized images.
  I'm not sure about this .. but if the user clicks on the image while
  its in the slideshow, this could cause a download of the full-sized
  image.

* Create a 'share-a-meal' functionality within the showattributes popup
  to allow users to send an email to their friends of a meal slideshow.
  Sharing doesn' require the person viewing to have an account.

* So the grid, showattributes, and the gridnav modules are logically 
  married.  So, this bunch can maintain state even though it's not
  being displayed.  If the user is looking at page 4, there's no reason
  to rollback to page 1 if they go off the first menu ..

* Make sure to write a 'are you sure you want to delete this meal' popup
  so that people don't accidentally delete something.

* Maybe define the 'hover' behavior of the new-meal icon to shrink the
  meal a bit, and write the words, 'New Meal' below.

* I'm thinking that this should be a single website: after the first http 
  request, everything else should be handed via ajax requests, and the 
  user experience should feel like you've never changed pages.  So the 
  top menu can maybe have icons- clicking the 'home' icon will switch out
  the middle (and possibly bottom) part of the page.

  What this means is that I can animate the 'grid' / 'grid-nav', etc onto
  the page if someone clicks on the 'edit' icon.

* Don't focus on the dropdown menus - that's too small.  Focus on the top 
  part- I'm not sure what it should look like - maybe the same shape as 
  the gridnav .. possibly have the mylunch logo peering out above.

* Maybe there's just one page: if you are logged in, you will be working on
  the 'editmeals' page.

* Yes .. will do ddmenu - I will make this a wrapper for the css stuff.

* Okay - I think I'm back to doing ddmenu, but still considering other
  options.  The advantage of ddmenu is that people would be less able to
  hack this site- which is a nice thing.

* Look at the arstechnica website: the background is graded, but it stays 
  in place as you scroll down.  This might be a nice affect.

* Maybe add a 'publish' button that will allow meals to be viewable by 
  everyone.  I can have a 'most viewed meals' on the first page, as well as
  as 'most recently published'.

* I had to stop myself from thinking about how to implement menus last night
  so that I could actually go to sleep..  I will create a menu-class, and a 
  title-bar class which is populated with menus from the menu class.

* General menu items: 
  'Contact Us'
  'Sign Out'
  'Share a Meal' - allow users to send this to other folks.  I will have to
  think about how to make this work.  This would probably belong on the 
  showattributes popup.
  'Donate a Meal' - I'm going to share a portion of my profits with 'City Meals 
  on Wheels', and other feed-the-hungry organizations.  
  'Meals on Wheels' - Best public slideshows?  Not sure .. I want
  'Fast Food' - recipes?
  'Lunchbox' ?


* So .. picturegrid, gridnav, showattributes, and carousel are very closely 
  related.  Even though I've taken care to make them 'separate', they need
  each other to make editpage.js to work correctly.  This will be different
  from my other pages.

* I could actually implement pretty much EVERYTHING as a popup.  I could
  implement a 'sign-up' popup (which would be very, very simple).  If I do 
  this correctly, then I could drop it into other pages .. etc.

* Next step: header.  Methodology: look at the headers of other pages.  Write
  down exactly what you want the menu options to be.  Then start coding 
  (probably this will be header.js).  You'll have to make the header completely
  separate from the rest.

* Work on the page header and footer .. this is a 'do-once, apply everywhere'
  sort of deal: it will probably look the same on all of my pages (at first, 
  anyway).

* Cap the number of meals that a user can have at maybe 1000.  Cap the
  number of pictures that a user can have to maybe 3000.  Each of these can 
  be increased by charging folks a fee .. maybe that's too nickle & dimey.

* An easier solution: I could allow the user to select a date via a popup
  calendar.

* Maybe extend the arrow paradigm, and make each range selection a 'tick' on
  the arrow?  As the user goes to the 'next' page of pictures, the ticks will
  flow from the right side of the page to the left side of the page, or from
  the left side of the page to the right side of the page if they do a 'prev'
  selection.  One possible issue: a user might require more ticks than will 
  fit on a page.  The 'last' tick could be in the shape of an arrow.

* The grid-nav bar is not required .. I will need something to hold the 
  'range-navigator' .. maybe this will become the ranged navigator.

* What would be cool: the hover behavior for the hamburger could be to display
  (nicely) some 'new meal' text.  The 'title' business isn't that great.  
  Another possibility: I could just make it smaller, and have 'new meal' 
  written under it.

* Change the carousel and the picturegrid to take an icon-image for the nomeal
  case. 

* The showattributes popup is larger than a two row picturegrid.  dont worry
  about it.  its going to change when i have a header & footer.

* Make gridnav nicer looking. 

* Gotta have a navigation menu .. everyone else does ..

* Abstract the 'nomeal' part of this.  Maybe it should be registered separately
  with each object rather than exposed as a dumb global.

* Get rid of stylesheet stuff (maybe)

* I want to create a 'header' and 'footer' section to add to pretty much 
  every page to make this look professional.

* I can create a 'share-slideshow' mechanism (or page) where you can provide 
  a list of email addresses, and the slideshow will be shared.  EVEN BETTER,
  I can make sure that the link that each of them follow is unique, and then
  the user could KNOW whether that person has looked at the slideshow or not.
  This might be an interesting page to add, actually: a 'has-viewed' page.
  I'm not sure about this: some folks might be turned off by the idea that 
  their friends know whether or not they saw something.  Also, it's tricky:
  each user would have to get a unique id.

* Some considerations:  at this point I have a very nice slideshow creator and
  viewer.  The next step is to create a way for people to 'share-a-meal'.

  YES!  'share this meal' with a friend - allows you to send a link which will
  pull up a slideshow with this meal in it.

  Another possibility is to follow someone's meals .. this was the facebook /
  twitter insight: people attempt to accrue followers - it becomes a sort of
  competition.  This is a magic bullet if I can make it work.

* Possibly scale the picturegrid according to the largest picture on the page
  rather than the largest possible picture .. this means that there could be
  a resizing if the user adds a picture..

* iconize menu maybe?

* Clean up the menu bar.  Maybe move to the bottom..

* The server side slowed DOWN with the upload pictures code.  I can't have this
  actually.  Optimize the HELL out of this code.  Do every dirty trick you can 
  think of to make it fast.  Do I HAVE to wait until the server gets it?
  Is there a way that I can just start displaying it without the network round-
  robbin?  Maybe that's a little too out-of-the-box ..

  For now, focus on the image-magick stuff .. I think I used to return quicker

* Navigation bar on the grid page should display not only a 'next page', and a 
  'prev page', but should have dots, or ranged numbers.  We could know 
  perfectly what these are.  MAYBE this can be implemented by sending down the
  ENTIRE mealinfo array - but just a pared-down version of it that contains
  only the timestamps.  This is semi-nice in that I wouldn't have to re-request
  this when I create or delete a meal.  The downside is that there's probably
  some performance issues if this is incredibly large array.  So .. maybe 
  these are placed in a tree.. yes .. that will probaly work .. sending this is 
  NOTHING compared to a jpeg, movie, etc .. trees are tough though - you have
  to rebalance them ..

  Better idea - bound the number of meals to something reasonable -- maybe 10 
  pages - have an arrow that will change the meaning of this in the navigation
  bar.

  Or .. maybe these are just dots above or below .. 

  Next big part of this page: "The Navigation Bar".

* So far the date is wrong .. maybe if i had only the date?  Maybe the calendar
  in the popup is wrong .. 

* I'm going to try adding the date to the footer

* Store the height and the width of the 'window' in some variables.  Create a
  'resize' handler that will adjust the layout a bit if the window width
  changes.  You'll have to create a default 'minwidth'.  The only height change
  would be if the new height exceeds your max-height, you should make the 
  fade-mask larger.

* Maybe while the modal is up, have the scrolling in the back be at half
  pace?

* The 'prevpage' variable is wrong in the deletemeals code, but correct
  if you actually click on the link.

* Delete meal is sortof working - study the 'lastpage' case, and the 'last
  item on last page' case.  The last-item case should go to the previous 
  page.  The general lastpage case should destroy hdivs (for now).

* Cut 1 keep whats there (sortof).

* Why is the modal torn down when I send an ajax request?

* Tweak the delete handler: what would really be cool is if when a picture is
  deleted, all of the other pictures shift over.  This should be doable.  Will
  write more in code.

* Set pictitle, meal, and other callback functions in the grid.  I am busy
  cleaning my room.

* If you've just gone into the modal to edit a meal, highlight the grid-page
  somehow showing the meal that you just edited.

* Move the nextprevpagelinks function into the grid.  Move the delete picture
  function into the grid.  This is going to be difficult for anyone without
  programming experience to modify, isn't it?

* Expose a 'count' function in the grid that returns the number of pictures
  being displayed.  If that is 1, firstGrid.attr == lastGrid.attr

* Have the picture grid maintain first and last pictures as they are being
  added and removed.  Maybe this should be like the carousel, and maybe I 
  should have a very formalized 'addpicture', and 'removepicture' function.
  I could additionally create a utility function which clears everything, 
  and rips through a mealinfo array adding all of the pictures.  Yes!  I will
  do that..

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

