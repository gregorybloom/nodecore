var fs = require('fs');
module.exports = function(webapp, express, io, basepath, configserver, configattr, sessionmanager, appcontroller, serverApp) {

  appcontroller.registeredapps = {};
  appcontroller.corepath = basepath.match("^(.*\/nodecore\/).*").pop();

  var AppClass = require('./webapps/app_class.js');

  var appset = Object.keys(configattr['apps']['appsconf']);

  for(i in appset) {
    if(typeof configattr['apps']['appsconf'][appset[i]]['active'] === "undefined")  continue;
    if(configattr['apps']['appsconf'][appset[i]]['active'] == false)              continue;

    var app_loadobj = appcontroller.buildAppPaths(appset[i],serverApp,configattr);
    if(app_loadobj == null) {
        console.log("Failed to find app: ",appset[i]);
        continue;
    }
    if( !fs.existsSync(app_loadobj.paths.appcorefilepath) ) {
      if( !fs.existsSync(app_loadobj.paths.appsourcepath) ) {
        console.log("app branch not deployed: ",appset[i],serverApp.launchMode,',',app_loadobj.paths.appsourcepath);
        continue;
      }
      else {
        console.log("core file not found:",app_loadobj.paths.appcorefilepath);
        process.exit(1);
      }
		}

    var subappclass = require(app_loadobj.paths.appcorefilepath)(AppClass);

    appcontroller.addApp(appset[i], subappclass,app_loadobj.paths,webapp,io,express,serverApp);
    appcontroller.initializeApp(appset[i], subappclass, app_loadobj, configattr, webapp, io, express, serverApp);
  }
  setInterval(  sessionmanager.checkClients.bind(sessionmanager), (1000*5)  );


  io.sockets.on('connection', function(socket) {
    sessionmanager.checkIfClientMissing(socket.request.user._id, socket.request.user, socket.request);

    for(i in appset) {
        if(typeof appcontroller.registeredapps[appset[i]] === "undefined") {
            console.log("Failed to find app: ",appset[i]);
            continue;
        }
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
