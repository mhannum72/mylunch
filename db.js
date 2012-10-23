db.open(function(err, db){
    if(!err) {
        db.collection('users', { safe: true }, function(err, collection) {
            var user = {username:'mhannum72@gmail.com'};
            if(err) {
                throw(err);
            }
            gbl_users_table = collection;

            // find myself (for now)
            gbl_users_table.findOne({username:'mhannum72@gmail.com'}, function(err, item) {
                console.log('user: ' + item.fname);
                gbl_user = item;
            });
        });
        db.collection('lunches', { safe: true }, function(err, collection) {
            if(err) {
                throw(err);
            }
            gbl_lunches_table = collection;
        });
    }
});


