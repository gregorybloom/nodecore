var UserSchema = require('../models/schema/usermodels/user.js');


module.exports = function(app, passport, configattr, sessionmanager) {

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
      successRedirect : '/profile', // redirect to the secure profile section
      failureRedirect : '/login', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
  }));
  app.post('/signup', passport.authenticate('local-signup', {
      successRedirect : '/login', // redirect to the secure profile section
      failureRedirect : '/signup', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
  }));


  app.post('/profile', function(req, res) {
    if(!req.isAuthenticated()) {
      res.redirect('/');
      return;
    }

    if(req.body.change_displayname=="") {
        var displayname = req.body.displayname;
        if(typeof displayname === "undefined")  displayname = req.user.username;
        if(displayname.match(/^\s*$/g))         displayname = req.user.username;

        console.log('display',displayname);
        req.user.displayname = displayname;

        UserSchema.update( {'email':req.user.email}, {'displayname':displayname}, function (err, numAffected) {
            res.redirect('/profile');
        });
      }
      else if(req.body.change_deleteaccount0=="") {
          req.flash('profileMessage', 'Are you sure you want to delete your profile?');
          res.render('profile.ejs', {
              message : req.flash('profileMessage'),
              delstep : 1,
              query : req.query,
              user : req.user // get the user out of session and pass to template
          });
      }
      else if(req.body.change_deleteaccount1=="") {
          req.user.remove( function(err) {
              if (err)        throw err;
              console.log('User successfully deleted');
              req.logout();
              res.redirect('/');
          });
      }
      else if(req.body.change_nothing=="") {
          res.redirect('/profile');
      }
      else {
          req.flash('profileMessage', 'Profile edit error');
          res.redirect('/profile');
      }
  });
};
