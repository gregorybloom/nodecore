function AppClass() {
}
AppClass.prototype.init = function() {
    this.appbasepath = undefined;
    this.appsourcepath = undefined;

    this.app = undefined;
    this.express = undefined;
    this.io = undefined;
    this.serverApp = null;

    this.appname = null;
    this.appspace = null;
    this.mongooseDB = null;

    this.usercount = 0;
    this.interval = 3000;
    this.clients = {};

    this.configdata = {};
    this.schema = {};
};
AppClass.prototype.setup = function(webapp,io,express,serverApp,app_pathobj,mongooseDB) {
    this.webapp = webapp;
    this.io = io;
    this.express = express;

    this.appbasepath = app_pathobj.appbasepath;
    this.appsourcepath = app_pathobj.appsourcepath;

    this.mongooseDB = mongooseDB;
    this.serverApp = serverApp;
};
AppClass.prototype.addSchema = function(name,schema) {
    this.schema[name] = schema;
};
AppClass.prototype.addConfigData = function(name,conf) {
    this.configdata[name] = conf;
};
AppClass.prototype.handleRouting = function(req,res,appcontroller) {
  if(typeof this.configdata['appdataconf']['paths']['view'] !== "undefined") {
    appcontroller.serveAppView(res,this.appname);
  }
  else {
    res.redirect('/404');
    return;
  }
};
AppClass.prototype.addExpressRoutes = function(appname,webapp,express,appcontroller) {
  webapp.get('/apps/'+this.appname, function(req, res){
    this.handleRouting(req,res,appcontroller);
  }.bind(this));
  webapp.get('/apps/'+this.appname+'/*', function(req, res){
    this.handleRouting(req,res,appcontroller);
  }.bind(this));
  if(typeof this.configdata.folderpaths['appstaticpath'] !== "undefined") {
    var appstaticpath = this.configdata.folderpaths['appstaticpath'];
    webapp.use('/apps/'+this.appname+'/static/', express.static(appstaticpath) );
  }
};

AppClass.prototype.intervalFn = function() {
};

AppClass.prototype.getDefaultRoom = function(data) {
  return "DefaultRoom";
},

AppClass.prototype.addUser = function(socketID,socket) {
    if(typeof this.clients[socketID] === "undefined")       this.clients[socketID]={};
    this.clients[socketID].socket=socket;
    this.clients[socketID].sessionID = socket.request.sessionID;

    console.log('add user:', socket.request.sessionID, socket.request.user.username,  socket.request.user.email );

    if(socket.request.user && socket.request.user._id)      this.clients[socketID].isauthed = true;
    if(this.clients[socketID].isauthed) {
      this.clients[socketID].userid = socket.request.user._id;
      this.clients[socketID].user={};
      this.clients[socketID].user.email = socket.request.user.email;
      this.clients[socketID].user.username = socket.request.user.username;
      this.clients[socketID].user.id = socket.request.user._id;

      this.clients[socketID].status = {};
      this.clients[socketID].status.isauthed = true;
    }
    var d = new Date();
    this.clients[socketID].activityTime = d.getTime();
    return this.clients[socketID];
};
AppClass.prototype.dropUser = function(socketID,socket) {
    if(typeof this.clients[socketID] === "undefined")       return;
    delete this.clients[socketID];
};
AppClass.prototype.addUserToRoom = function(socketID,socket,roomname) {
    if(typeof this.clients[socketID] === "undefined")       return;

    socket.join(roomname);
    this.clients[socketID].roomname = roomname;
};
AppClass.prototype.dropUserFromRoom = function(socketID,socket) {
  var roomname = this.clients[socketID].roomname;
  socket.leave(roomname);
  this.clients[socketID].roomname = null;
};
AppClass.prototype.getClientList = function(roomname) {
    var list = [];
    for(socketID in this.clients) {
        if(typeof roomname === "string" && this.clients[socketID].roomname !== roomname)
            continue;
        var clientnameobj = this.getClientName(socketID,true);
        if(this.clients[socketID].status)      clientnameobj.status = this.clients[socketID].status;

        list.push(clientnameobj);
    }
    return list;
};
AppClass.prototype.deAuthClient = function(socketID,socket) {
  if(typeof this.clients[socketID].userid === "undefined")    return;

  if(typeof this.clients[socketID].isauthed !== "undefined")     delete this.clients[socketID].isauthed;
  if(typeof this.clients[socketID].status !== "undefined") {
    if(typeof this.clients[socketID].status.isauthed !== "undefined")      delete this.clients[socketID].status.isauthed;
  }

  if(typeof this.clients[socketID].user !== "undefined")            delete this.clients[socketID].user;
  if(typeof this.clients[socketID].displayname !== "undefined")     delete this.clients[socketID].displayname;
  if(typeof this.clients[socketID].username !== "undefined")        delete this.clients[socketID].username;

};
AppClass.prototype.upAuthClient = function(socketID,socket,inputobj,callback) {
    if(inputobj == null || typeof inputobj === "undefined")  inputobj = {};
    if(this.mongooseDB == null)     return;

    console.log("upauth client:",socketID);

    if(inputobj['user'] != null && typeof inputobj['user'] !== "undefined")  {
      this.clients[socketID].user={};
      this.clients[socketID].userid=inputobj['user']._id;
    }
    if(inputobj['newuserid'] != null && typeof inputobj['newuserid'] !== "undefined")  {
      this.clients[socketID].user={};
      this.clients[socketID].userid=inputobj['newuserid'];
    }
    else if(typeof this.clients[socketID].userid === "undefined")    return;

    var userid = this.clients[socketID].userid;
    var UserSchema = serverApp.schema.User;
    UserSchema.findOne({"_id":userid}, function(err, founduser) {
        if(err) {
            console.log("upauth error:",err);
            return;
        }
        if(founduser) {
            this.clients[socketID].isauthed = true;
            var roomname = this.clients[socketID].roomname;

            if(typeof this.clients[socketID].status === "undefined")  this.clients[socketID].status = {};
            this.clients[socketID].status.isauthed = true;

            this.clients[socketID].userid = founduser._id;
            this.clients[socketID].user={};
            this.clients[socketID].user.email = founduser.email;
            this.clients[socketID].user.username = founduser.username;
            this.clients[socketID].user.id = founduser._id;
            if(founduser.displayname)   this.clients[socketID].displayname = founduser.displayname;
            if(founduser.username)      this.clients[socketID].username = founduser.username;

            callback();
      }
    }.bind(this));
};
AppClass.prototype.endSocket = function(socket, roomkeeper) {
    var socketID = socket.id;
    if(typeof this.clients[socketID] === "undefined")  return;
    var roomname = this.clients[socketID].roomname;

    this.dropUserFromRoom(socketID,socket);
    this.dropUser(socketID,socket);
};
AppClass.prototype.initSocket = function(socket, roomkeeper,initcall,discall) {

    socket.on(this.appspace+'connection', function(msg) {
        var socketID = socket.id;
        console.log('connected at: ',socketID, ',', socket.request.sessionID);

        var client = this.addUser(socketID,socket);
        var defroom = this.getDefaultRoom();

        this.addUserToRoom(socketID,socket,defroom);

        initcall(socketID,client);
    }.bind(this));
    socket.on(this.appspace+'disconnect', function(msg) {
        var socketID = socket.id;
        console.log('disconnected: ',socketID, ',', socket.request.sessionID);

        var client = this.dropUser(socketID,socket);
        discall(socketID,client);
    }.bind(this));
};
AppClass.alloc = function() {
    var vc = new AppClass();
  	vc.init();
  	return vc;
};

module.exports = AppClass;
