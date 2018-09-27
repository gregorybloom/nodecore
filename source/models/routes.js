
module.exports = function(app, basepath, configserver, configattr, sessionmanager, serverApp) {

  var UserSchema = serverApp.schema.User;
  var FUNCTIONSCLASS=require('../models/functions.js');

  app.all('*', function(req, res, next) {

      if(req.user && req.isAuthenticated()) {
        if(sessionmanager.clients[req.user._id]) {
          if(sessionmanager.clients[req.user._id].drop)        sessionmanager.logoutClient(req.user._id, req);
        }
      }

      if(req.isAuthenticated()) {
          if(req.user) {
              if(!sessionmanager.hasClient(req.user._id)) {
                  sessionmanager.addClient(req.user._id, req.user, req);
              }
              sessionmanager.updateClient(req.user._id,req.user,req);
          }
      }
      next();
  });

  app.get('/',
      function(req, res, next){
        if(!req.isAuthenticated()) {
            res.render('index.ejs', {
                message: req.flash('loginMessage'),
                domain : "manaofmana.com",
                servermode : configserver.mode
            });
        }
        else {
            res.render('index2.ejs', {
                domain : "manaofmana.com",
                servermode : configserver.mode
            });
        }
      }
  );
  app.get('/apps/testgame', function(req, res){
    var appname = 'testgame';
    sessionmanager.appcontroller.serveAppView(res,appname,configattr);
  });
  app.get('/apps/chat', function(req, res){
    var appname = 'chat';
    sessionmanager.appcontroller.serveAppView(res,appname,configattr);
  });
  app.get('/login', function(req, res) {
      // render the page and pass in any flash data if it exists
      res.render('login.ejs', {
          message: req.flash('loginMessage'),
          domain : "manaofmana.com"
      });
  });
  app.get('/signup', function(req, res) {
      // render the page and pass in any flash data if it exists
      res.render('signup.ejs', { message: req.flash('signupMessage') });
  });
  app.get('/verifyemail',function(req,res){
    res.render('verifyemail.ejs', { message: req.flash('verifyEmailMessage') });
  });
  app.get('/profile', function(req, res) {
    if(!req.isAuthenticated()) {
      res.redirect('/');
      return;
    }
    res.render('profile.ejs', {
      message : req.flash('profileMessage'),
      query : req.query,
      user : req.user // get the user out of session and pass to template
    });
  });
  app.get('/logout', function(req, res) {
    if(!req.isAuthenticated()) {
      res.redirect('/');
    }
    else {
      console.log('client logout:',req.user._id);
      sessionmanager.removeClient(req.user._id);
      sessionmanager.logoutClient(req.user._id, req);
      res.redirect('/');
    }
  });
  app.get('/404', function(req, res) {
    res.redirect('/');
  });


  app.get('/verify',function(req,res){
      if((req.protocol+"://"+req['hostname'])==("https://"+configserver['hostname']))
      {
          if(typeof req.query.hash === "undefined" || req.query.hash == null) {
            req.flash('loginMessage', "Verify failed.  No unverified account listed." );
            res.redirect('/login');
            return;
          }
          UserSchema.findOne({'verifyHash':req.query.hash}, function(err, user) {
            if(err) {
                console.log('ERR',JSON.stringify(err));
                req.flash('loginMessage', JSON.stringify(err) );
                res.redirect('/login');
            }
            if(user) {
                if(!user.verified) {
                    UserSchema.update( {'email':user.email}, {'verified':true}, function (err2, numAffected) {
                      if(err2) {
                          console.log('ERR2',JSON.stringify(err2));
                          req.flash('loginMessage', JSON.stringify(err2) );
                          res.redirect('/login');
                      }
                      if(numAffected.nModified==0) {
                        req.flash('loginMessage', "Verify failed.  No unverified account listed." );
                        res.redirect('/login');
                      }
                      else if(numAffected.nModified==1) {
                        req.flash('loginMessage', "Account has been successfully verified." );
                        res.redirect('/login');
                      }
                      else {
                        req.flash('loginMessage', "Verify failed.  No unverified account listed." );
                        res.redirect('/login');
                      }
                  });
              }
              else {
                req.flash('loginMessage', "Verify failed.  No unverified account listed." );
                res.redirect('/login');
              }
           }
           else {
             req.flash('loginMessage', "Verify failed.  No unverified account listed." );
             res.redirect('/login');
           }
        });
    }
    else
    {
      req.flash('loginMessage', "<h1>Request is from unknown source</h1>" );
      res.redirect('/login');
    }
  });




};
