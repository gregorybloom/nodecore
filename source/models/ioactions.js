module.exports = function(app, io, basepath, configattr, sessionmanager, appcontroller) {

  var appset = ['chat'];
  for(i in appset) {
    var subapp = require('../models/webapps/'+appset[i]+'.js');
    appcontroller.addApp(subapp.appname, subapp);
  }

  io.sockets.on('connection', function(socket) {
    sessionmanager.checkIfClientMissing(socket.request.user._id, socket.request.user, socket.request);

    var appset = ['chat'];
    for(i in appset) {
      var subapp = require('../models/webapps/'+appset[i]+'.js');
      subapp.init(app, io, socket, basepath, null);
    }

    if(socket.request.user.logged_in == false) {
//    if(socket.request.isAuthenticated() == false) {
      console.log('User connected: Guest ('+ socket.request.sessionID.substring(0,8) +') logged in');
    }
    else {
      console.log('User connected:'+ socket.request.user.email.split("@").shift() );
    }


    var name = "";
    //    if(socket.request.isAuthenticated() == false)   name = "Guest ("+socket.request.sessionID.substring(0,8)+")"
    if(socket.request.user.logged_in == false)   name = "Guest ("+socket.request.sessionID.substring(0,8)+")"
    else                                            name = socket.request.user.email.split("@").shift()

    socket.on('disconnect', function(){
      io.emit('User disconnected: ' + name);
      console.log(name+' disconnected');

      for(i in appset) {
      	var subapp = require('../models/webapps/'+appset[i]+'.js');
        subapp.end(app, io, socket, null);
        //	appcontroller.addApp(express, subapp.appname, subapp);
      }
    });
  });


};
