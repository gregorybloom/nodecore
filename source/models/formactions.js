var UserSchema = require('../models/schema/usermodels/user.js');


module.exports = function(app, passport, configattr, sessionmanager) {

  var FUNCTIONSCLASS=require('../models/functions.js');

  app.post('/signup', function(req, res) {
    var password = req.body.password;
    var email = req.body.email;
    var username = req.body.username;

  //  var UserSchemaMethods = mongoose.model('User').methods;
  //  UserSchemaMethods.generateHash("TEXT");

    var failmsg = undefined;
    if(typeof email === "undefined")  failmsg = 'A valid email is required';
    if(email.match(/^\s*$/g))         failmsg = 'A valid email is required';
    if(typeof username === "undefined")  failmsg = 'A valid username is required';
    if(username.match(/^\s*$/g))         failmsg = 'A valid username is required';
    if(typeof failmsg !== "undefined") {
        req.flash('signupMessage', failmsg);
        res.redirect('/signup');
        return;
    }

    process.nextTick(function() {

        function authSteps(step){

            var checkobj = {};
            if(step == 1)       checkobj = { 'email' : email };
            if(step == 2)       checkobj = { 'username' : username };
            if(step == 3)       checkobj = { 'email' : email };
            if(step == 4)       checkobj = { 'email' : email };


            if(step == 1) {
              if(true) {
                  var err = false;  var user = false;
  //              AuthInfo.findOne(checkobj, function(err, user) {
                    if(err) {
                        req.flash('signupMessage', JSON.stringify(err) );
                        res.redirect('/signup');
                    }
                    if(user) {
                        var flashmsg = 'Error';
                        if(step == 1)           flashmsg = 'That email is already taken.';
                        req.flash('signupMessage', flashmsg);
                        res.redirect('/signup');
                    }
                    else {
                        if(step == 1)           authSteps(step+1);
                    }
                }
  //              });
            }
            else if(step == 2 || step == 3) {
  //              User.findOne(checkobj, function(err, user) {
                if(true) {
                    var err = false;  var user = false;
                    if(err) {
                        req.flash('signupMessage', JSON.stringify(err) );
                        res.redirect('/signup');
                    }
                    if(user) {
                        var flashmsg = 'Error';
                        if(step == 2)           flashmsg = 'That username is already taken.';
                        if(step == 3)           flashmsg = 'That email is already taken.';
                        req.flash('signupMessage', flashmsg);
                        res.redirect('/signup');
                    }
                    else {
                        if(step == 2)           authSteps(step+1);
                        if(step == 3)           authSteps(step+1);
                    }
  //              });
                }
            }
            else {
  //              ApprovedEmail.findOne(checkobj, function(err3, appr) {
                if(true) {
                  var appr = true;  var err3 = false;

                    if(err3) {
                        req.flash('signupMessage', JSON.stringify(err3) );
                    }
                    else if(appr) {
                        var newUser            = new UserSchema();
  //                      var newAuthInfo         = new AuthInfo();
  //                      var newAccountExtras    = new AccountExtras();
  /*                            var newUserPrefs    = new UserPrefs();
                        var newUserDisplayPrefs    = new UserDisplayPrefs();
                        var newUserProfile    = new UserProfile();    /**/

                        // set the user's local credentials
                        newUser.password = newUser.generateHash(password);
                        newUser.username = username;
                        newUser.displayname = username;
                        newUser.email = email;
  //                      newUser.authid = newAuthInfo._id;
  //                      newUser.accexid = newAccountExtras._id;

  //                      newAuthInfo.accountid    = newUser._id;
  //                      newAuthInfo.local.email    = email;
  //                      newAuthInfo.local.password = newAuthInfo.generateHash(password);

  //                      newAccountExtras.accountid = newUser._id;
  /*                            newAccountExtras.curprofid = newUserProfile._id;
                        newAccountExtras.curprefid = newUserPrefs._id;

                        newUserProfile.accexid = newAccountExtras._id;
                        newUserPrefs.accexid = newAccountExtras._id;
                        newUserDisplayPrefs.accexid = newAccountExtras._id; /**/


                        // save the user
                        newUser.save(function(err) {
                          console.log('save',err);
                            if (err)
                                throw err;

                            console.log('User '+username+' successfully created');
  /*
                            newAuthInfo.save(function(err) {
                                if (err)
                                    throw err;

                                console.log('AuthInfo '+newUser._id+' successfully created');
                                newAccountExtras.save(function(err) {
                                    console.log('AccountExtras '+newUser._id+' successfully created');
                                    newUserProfile.save(function(err) {
                                        console.log('UserProfile '+newUser._id+' successfully created');
                                    });
                                    newUserPrefs.save(function(err) {
                                        console.log('UserPrefs '+newUser._id+' successfully created');
                                    });
                                    newUserDisplayPrefs.save(function(err) {
                                        console.log('UserDisplayPrefs '+newUser._id+' successfully created');
                                    });
                                });

  //                              req.flash('loginMessage', 'User successfully created.');
  //                              res.redirect('/login');

                            });
                            /**/

                        });
                        // Moved here temporarily
                        req.flash('loginMessage', 'User successfully created.');
                        res.redirect('/login');
                    }
                    else {
                        req.flash('signupMessage', 'That email is not approved.');
                        res.redirect('/signup');
                    }
  //              });
                }
            }
        };
        authSteps(1);
      });
    });

    //}));
    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
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
