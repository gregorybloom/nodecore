module.exports = function(app, io, basepath, configattr, sessionmanager, appcontroller) {

  var appset = ['chat'];
  for(i in appset) {
    var subapp = require('../models/webapps/'+appset[i]+'.js');
    appcontroller.addApp(subapp.appname, subapp);
  }
  setInterval(  sessionmanager.checkClients.bind(sessionmanager), (1000*5)  );


  io.sockets.on('connection', function(socket) {
    sessionmanager.checkIfClientMissing(socket.request.user._id, socket.request.user, socket.request);

    var appset = ['chat'];
    for(i in appset) {
      var subapp = require('../models/webapps/'+appset[i]+'.js');
      subapp.init(app, io, socket, basepath, null);
    }

    if(socket.request.user.logged_in == false) {
      console.log('User connected: Guest ('+ socket.id.substring(0,8) +') logged in');
    }
    else {
      console.log('User connected:'+ socket.request.user.email.split("@").shift() );
    }

    if(typeof sessionmanager.socketset[socket.request.sessionID] === "undefined") {
      sessionmanager.socketset[socket.request.sessionID] = {};
    }
    var d = new Date();
    sessionmanager.socketset[socket.request.sessionID][socket.id] = {socket:socket,connectedTime:d.getTime()};


    var name = "";
    if(socket.request.user.logged_in == false)      name = "Guest ("+socket.id.substring(0,8)+")"
    else                                            name = socket.request.user.email.split("@").shift()

    socket.on('disconnect', function(){
      io.emit('User disconnected: ' + name);
      console.log(name+' disconnected');

      delete sessionmanager.socketset[socket.request.sessionID][socket.id];

      for(i in appset) {
      	var subapp = require('../models/webapps/'+appset[i]+'.js');
        subapp.end(app, io, socket, null);
        //	appcontroller.addApp(express, subapp.appname, subapp);
      }
    });
    socket.on('website-heartbeatreturn', function(msg){
      if(typeof sessionmanager.socketset[socket.request.sessionID] ==! "undefined") {
        if(typeof sessionmanager.socketset[socket.request.sessionID][socket.id] ==! "undefined") {
          var d = new Date();
          sessionmanager.socketset[socket.request.sessionID][socket.id].connectedTime=d.getTime();
        }
      }
    });
  });


};
