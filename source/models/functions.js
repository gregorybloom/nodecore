//    https://www.sitepoint.com/understanding-module-exports-exports-node-js/
module.exports = {
    generateActivationEmail: function(req,email,smtpTransport,smtpconf,serverApp) {
        var UserSchema = serverApp.schema.User;
        UserSchema.findOne({'email':email}, function(err, user) {
              if(err) {
                  req.flash('signupMessage', JSON.stringify(err) );
                  res.redirect('/signup');
              }
              if(user) {
                  if(user.verified) {
                    req.flash('signupMessage', "Account is already activated." );
                    res.redirect('/signup');
                    return;
                  }
                  var testhash = user.generateSimpleHash();
                  UserSchema.update( {'email':email}, {'verifyHash':testhash}, function (err2, numAffected) {
                      if(err2) {
                          req.flash('signupMessage', JSON.stringify(err2) );
                          res.redirect('/signup');
                          return;
                      }
                      if(numAffected==1) {
                          req.flash('signupMessage', "Activation email sent." );
                          res.redirect('/signup');
                      }
                      if(numAffected==0) {
                          req.flash('signupMessage', "Error: Creation of activation hash failed." );
                          res.redirect('/signup');
                      }
                  });
              }
        });
  	},


    onAuthorizeSuccess: function(data, accept){
      console.log('successful connection to socket.io');
      accept(); //Let the user through
    },
    onAuthorizeFail: function(data, message, error, accept){
      if(error) accept(new Error(message));
      console.log('failed connection to socket.io:', message);
      accept(null, false);
    }
};
