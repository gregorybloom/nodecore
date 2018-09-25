module.exports = function(webapp, express, io, basepath, configserver, configattr, sessionmanager, appcontroller) {

  appcontroller.registeredapps = {};
  appcontroller.corepath = basepath.match("^(.*\/nodecore\/).*").pop();

  var AppClass = require('./webapps/app_class.js');

  var appset = ['chat','testgame'];
  var appset = ['chat'];
  for(i in appset) {
    var appname = appset[i];

    var confobj = appcontroller.fetchAppPath(appname,configattr);
    if(confobj == null)   return;

    var subapp = require(confobj.appcorepath)(AppClass);
    appcontroller.addApp(appname, subapp,confobj.appconf,confobj.appbasepath,webapp,io,express,basepath);
  }
  setInterval(  sessionmanager.checkClients.bind(sessionmanager), (1000*5)  );


  io.sockets.on('connection', function(socket) {
    sessionmanager.checkIfClientMissing(socket.request.user._id, socket.request.user, socket.request);

    for(i in appset) {
        var subappinstance = appcontroller.registeredapps[appset[i]].instance;
        subappinstance.initSocket(socket, null);
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
    if(socket.request.user.logged_in == false)      name = socket.id.substring(0,8);
    else                                            name = socket.request.user.email.split("@").shift();

    socket.on('disconnect', function(){
      io.emit('User disconnected: ' + name);
      console.log(name+' disconnected');

      delete sessionmanager.socketset[socket.request.sessionID][socket.id];

      for(i in appset) {
        var confobj = appcontroller.fetchAppPath(appset[i],configattr);
        if(confobj == null)   return;

        var subappinstance = appcontroller.registeredapps[appset[i]].instance;
        subappinstance.endSocket(socket, null);
        //	appcontroller.addApp(express, subapp.appname, subapp);
      }
    }.bind(this));
    socket.on('website-heartbeatreturn', function(msg){
      if(typeof sessionmanager.socketset[socket.request.sessionID] !== "undefined") {
        if(typeof sessionmanager.socketset[socket.request.sessionID][socket.id] !== "undefined") {
          var d = new Date();
          sessionmanager.socketset[socket.request.sessionID][socket.id].connectedTime=d.getTime();
//          console.log('----- beat:',socket.request.sessionID,',',socket.id,'=',d.getTime());
        }
      }
    });
  }.bind(this));


};
