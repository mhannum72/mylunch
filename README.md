mylunch
=======
* Personal project: a website where people can upload pictures of their meals.

todo
====

fairly solid stuff:
* Maybe make the restaurant fill-in as simple as possible to use.  Auto-
  complete the field as they are typing.
* YES!  this is it.  see references/building fast client side searches.
  every keystroke can result in a new selection being sent from the server
  to the browser.  The user's results can be tailored to suit them: that is,
  if we know the users home address, or where the request is being made from,
  the resulting list of restaurants can be tailored to that.
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

