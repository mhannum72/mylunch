mylunch projects
================

* Publish / follow functionality 

  Publish data format:

  Use a push-to-followers model when a user publishes.  If user X publishes a
  meal, a record containing this meal is pushed to all of user Xs followers.
  The publish records have this layout:
    {
       followerid;          // Person who is following 
       publishtimestamp;    // For the 'recently published' screen
       creatorid;           // Person who created this meal
       timestampofmeal;     // Timestamp of published meal
       hasbeenviewed;       // True if this follower has viewed
    }
  This should have indexes on (followerid+publishtimestamp) and (creatorid+
  timestampofmeal).

  Unpublish / timeout:

  1 X unpublishes a meal or the unpublish deamon sees the timeout
  2 All of the live web-sessions are updated (the link is removed)
    - The meal is removed from users walls if they are viewing that
    - The meal is removed from all this-users-meals walls
  3 Delete all of the publish-id-timestamp records.
  4 Mark each picture as unpublished
  5 Mark the meal as unpublished
  6 If someone manages to click a link anyway display a this meal has been 
    unpublished modal.

  Publish & publish with timeout
  1 X publishes a meal and is assigned a publish-id-timestamp
  2 The meal entry is updated with is-published, and an unpublish-at-time (for 
    the unpublish deamon)
  3 Each of the meals pictures are labeled as world-viewable
  4 A record for each of Xs followers is inserted in the database
  5 Live web sessions are updated: this might be difficult-ish
  6 Users that want texts / etc are updated (i think this is easier)

  So long as a meal is published, the author cannot change it.  Instead theyll
  have to unpublish, change, and then republish.  The republish will generate
  a new publish-timestamp.

  People will be able to view these meals in the carousel by clicking on them as
  they appear on the page.  

  Follow data format:

  There should be a following table containing records that look like this:

  {
     userid;                // User who is following
     followingid;           // User who is being followed 
     datestartedfollowing;  // Date when this user began following
     attributes;            // Attributes or filters (not sure about this)
  }

  An index should be placed on both the userid and the followingid fields.  If
  userid X wants to follow userid Y, I can model this simply adding a record 
  into the following table.  If userid X wants to stop following userid Y, I 
  can simply remove this record.

  Recently published screen will list the most recently published meals from
  the users that X is following in reverse order (newest on top) of the meals.
  I want to facilitate live unpublish events.  That is, user Ys meal should 
  disappear from this screen when Y unpublishes.  I think this can be done 
  using comet requests.  The recently published screen will need a comet event
  handler subwindow.  I havent done this but i think its straightforward code.

  Comet is essentially an outstanding ajax request.  The server and client
  might have very long-spaced ping-pong requests (not sure if this matters).
  The server will need to know whats on the clients screen, and will need to 
  send the client a this-has-been-unpublished event.

  The problem is that this is difficult to scale.  I might have multiple web
  servers, and there would have to be a way to convey to all of them that 
  someone has unpublished something.

  Passive strategy: still use a comet request, but rather than the server 
  pushing this event out, i detect when the client attempts to access an
  unpublished meal.

--

* Add a content navigation screen to the carousel

* Add title-per-picture functionality in showattributes and carousel
