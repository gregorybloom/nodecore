// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model

// expose this function to our app using module.exports
module.exports = function(passport,serverApp, confobj) {
  var UserSchema            = serverApp.schema.User;
  var loadpaths = confobj.loadpaths;
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session


    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        UserSchema.findById(id, function(err, user) {
            done(err, user);
        });
    });
/**/
    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {
          var email = req.body.email;
/*          var password = req.body.password;
          var username = req.body.username;
/**/
          var failmsg = undefined;
          if(typeof email === "undefined")  failmsg = 'A valid email is required';
          if(email.match(/^\s*$/g))         failmsg = 'A valid email is required';
          if(typeof username === "undefined")  failmsg = 'A valid username is required';
          if(username.match(/^\s*$/g))         failmsg = 'A valid username is required';
          if(typeof failmsg !== "undefined") {
            return done(null, false, req.flash('signupMessage', failmsg));
          }

          process.nextTick(function() {

              function authSteps(step){

                  var checkobj = {};
                  if(step == 1)       checkobj = { 'email' : email };
                  if(step == 2)       checkobj = { 'username' : username };
                  if(step == 3)       checkobj = { 'email' : email };
                  if(step == 4)       checkobj = { 'email' : email };


                  if(step == 1) {
                      var err = false;  var user = false;
      //              AuthInfo.findOne(checkobj, function(err, user) {
                        if(err) {
                            return done(null, false, req.flash('signupMessage', JSON.stringify(err)));
                        }
                        if(user) {
                            var flashmsg = 'Error';
                            if(step == 1)           flashmsg = 'That email is already taken.';
                            return done(null, false, req.flash('signupMessage', flashmsg));
                        }
                        else {
                            if(step == 1)           authSteps(step+1);
                        }
      //              });
                  }
                  else if(step == 2 || step == 3) {
                      UserSchema.findOne(checkobj, function(err, user) {
                          if(err) {
                              return done(null, false, req.flash('signupMessage', JSON.stringify(err)));
                          }
                          if(user) {
                              var flashmsg = 'Error';
                              if(step == 2)           flashmsg = 'That username is already taken.';
                              if(step == 3)           flashmsg = 'That email is already taken.';
                              console.log('failure:',flashmsg);
                              return done(null, false, req.flash('signupMessage', flashmsg));
                          }
                          else {
                              if(step == 2)           authSteps(step+1);
                              if(step == 3)           authSteps(step+1);
                          }
                      });
                  }
                  else {
        //              ApprovedEmail.findOne(checkobj, function(err3, appr) {
                      if(true) {
                        var appr = true;  var err3 = false;

                          if(err3) {
                            return done(null, false, req.flash('signupMessage', JSON.stringify(err3)));
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
                              newUser.verified = false;
                              newUser.verifyHash = newUser.generateSimpleHash();
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

                                  var testhash = newUser.verifyHash;
                                  var SMTPCLASS=require('../models/smtp.js');
                                  SMTPCLASS.sendVerifyMail(loadpaths,newUser.email,{'hash':testhash,'host':req['hostname'],'port':confobj.port});

                                  var flashmsg = 'User created.  Verification email sent.';
                                  return done(null, false, req.flash('signupMessage', flashmsg));
                              });
                              // Moved here temporarily
                          }
                          else {
                              var flashmsg = 'That email is not approved.';
                              return done(null, false, req.flash('signupMessage', flashmsg));
                          }
        //              });
                      }
                  }
              };
              authSteps(1);
            });

/*
            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function() {

                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                UserSchema.findOne({ 'email' :  email }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {

                        // if there is no user with that email
                        // create the user
                        var newUser            = new UserSchema();

                        // set the user's local credentials
                        newUser.email    = email;
                        newUser.password = newUser.generateHash(password);

                        // save the user
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }

                });
            });   /**/
        }
    ));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) { // callback with email and password from our form

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            UserSchema.findOne({ 'email' :  email }, function(err, user) {
                // if there are any errors, return the error before anything else
                if (err)
                    return done(err);

                // if no user is found, return the message
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'Email or password does not match.')); // req.flash is the way to set flashdata using connect-flash

                // if the user is found but the password is wrong
                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Email or password does not match.')); // create the loginMessage and save it to session as flashdata

                if (!user.verified) {
                  var testhash = user.verifyHash;
                  var SMTPCLASS=require('../models/smtp.js');
                  SMTPCLASS.sendVerifyMail(loadpaths,user.email,{'hash':testhash,'host':req['hostname'],'port':confobj.port});

                  return done(null, false, req.flash('loginMessage', 'User not verified.  Re-sent email verification link.')); // create the loginMessage and save it to session as flashdata
                }

                // all is well, return successful user
                return done(null, user);
            });
        }
    ));

};
/**/
