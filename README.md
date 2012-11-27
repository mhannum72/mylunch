mylunch
=======
* Personal project: a website where people can upload pictures of their meals.

todo
====

* I have a couple of decisions to make at this point:
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
    username.  So 'my_kitchen@georgiagirl' would be an example.  Other users
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

