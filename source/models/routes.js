module.exports = function(app, basepath, configattr, sessionmanager) {

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
                domain : "manaofmana.com"
            });
        }
        else {
            res.render('index2.ejs', {
                domain : "manaofmana.com"
            });
        }
      }
  );
  app.get('/chat', function(req, res){
    res.sendFile(basepath + '/views/pages/chat.html');
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
      console.log('client logout');
      sessionmanager.removeClient(req.user._id);
      req.logout();
      res.redirect('/');
    }
  });




};
