//    https://www.sitepoint.com/understanding-module-exports-exports-node-js/
module.exports = {


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
