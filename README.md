mylunch
=======

Personal project: a website where people can upload pictures of their meals.

users
-
username (email address) - will be unique in this table
password 
login cookie
last login time
time user joined
 ..
(other stats)


meals:
-
username
pic-id: username + pic-id should be unique .. this can be time-based (ms)
        (i don't think that there will be more than a pic uploaded per second).
picture-name-uploaded
time uploaded (put an index on this)
what meal (breakfast? lunch? dinner?)
thumb-pic (scaled to 300 i think)
full-sized-pic (scaled to something reasonable- maybe that will be an upload constraint).
is this available for global viewing (user's decision)
is this available for global viewing (my decision)



Advertisers index:


an indexable unique-id for the user for quick-lookup.
    - create a js seed generator
    - or maybe just use the user's email

