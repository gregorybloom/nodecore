/*
req.socket.id;  // the Session ID
socket.id;  // the Socket ID

// sending to the client
socket.emit('hello', 'can you hear me?', 1, 2, 'abc');

// sending to all clients except sender
socket.broadcast.emit('broadcast', 'hello friends!');

// sending to all clients in 'game' room except sender
socket.to('game').emit('nice game', "let's play a game");

// sending to all clients in 'game1' and/or in 'game2' room, except sender
socket.to('game1').to('game2').emit('nice game', "let's play a game (too)");

// sending to all clients in 'game' room, including sender
io.in('game').emit('big-announcement', 'the game will start soon');

// sending to all clients in namespace 'myNamespace', including sender
io.of('myNamespace').emit('bigger-announcement', 'the tournament will start soon');

// sending to individual socketid (private message)
socket.to(<socketid>).emit('hey', 'I just met you');

// sending with acknowledgement
socket.emit('question', 'do you think so?', function (answer) {});

// sending without compression
socket.compress(false).emit('uncompressed', "that's rough");

// sending a message that might be dropped if the client is not ready to receive messages
socket.volatile.emit('maybe', 'do you really need it?');

// sending to all clients on this node (when using multiple nodes)
io.local.emit('hi', 'my lovely babies');
/**/
//    https://socket.io/docs/emit-cheatsheet/
//  https://socket.io/docs/rooms-and-namespaces/
var ExpressChatApp = {

    basepath: undefined,
    app: undefined,
    io: undefined,
    appname: 'expresschat',
    appspace: 'expresschat-',
    usercount: 0,
    interval: 3000,
    clients: {},

    intervalFn: function() {
        this.sendHeartbeat();
    },

    sendHeartbeat: function() {
      var obj = {type:'heartbeat'};
        for(sockid in this.clients) {
          this.clients[sockid].socket.emit(this.appspace+'heartbeat', obj);
          var d = new Date();
//          this.clients[item].time = d.getTime();
          this.checkbeat(sockid);
      }
    },
    checkbeat: function(sockid) {
      var d = new Date();
      if(typeof this.clients[sockid].time === "undefined")    this.clients[sockid].time = d.getTime();
      var socket = this.clients[sockid].socket;

      var deltatime = d.getTime() - this.clients[sockid].time;
      if( deltatime >= (this.interval*6) ) {
          this.dropUser(sockid,this.app,this.io,socket);
      }
      else if( deltatime >= (this.interval*3) ) {
          if(typeof this.clients[sockid].status === "undefined" || !this.clients[sockid].status.dropping) {
              var roomname = this.clients[sockid].roomname;

              if(typeof this.clients[sockid].status === "undefined")      this.clients[sockid].status={};
              this.clients[sockid].status.dropping = true;
              this.sendClientList(this.app,this.io,socket,roomname);
          }
      }
    },
    addUser: function(socketID,app,io,socket) {
      if(typeof this.clients[socketID] === "undefined")       this.clients[socketID]={};
      this.clients[socketID].socket=socket;

      if (typeof socket.request.user !== "undefined") {
        this.updateClientName(socketID,socket);
      }
      this.clients[socketID].tempname =  socketID.substring(0,8);


      if(socket.request.user && socket.request.user.userid)      this.clients[socketID].isauthed = true;
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
        this.clients[socketID].time = d.getTime();


        var nameobj = {};
        if (typeof this.clients[socketID].displayname !== "undefined") {
          nameobj.displayname = this.clients[socketID].displayname;
        }
        else if (typeof this.clients[socketID].tempname !== "undefined") {
          nameobj.tempname = this.clients[socketID].tempname;
        }

        var fetchname = this.getClientName(socketID);
        this.sendServerMessage(socketID,app,io,socket,null,
          "You have connected.",
          fetchname+" has connected.");

        socket.emit(this.appspace+'loaded name',nameobj);

        return this.clients[socketID];
    },
    dropUser: function(socketID,app,io,socket) {
      if(typeof this.clients[socketID] === "undefined")       return;

      var fetchname = this.getClientName(socketID);
      this.sendServerMessage(socketID,app,io,socket,null,
        null,
        fetchname+" has disconnected.");

      delete this.clients[socketID];
    },
    sendServerMessage: function(socketID,app,io,socket,roomname,messageLocal,messageOther) {
      var messageobj = {'message':messageOther};
      if(messageOther != null) {
          if(roomname != null) {
          socket.to(roomname).emit(this.appspace+'server message', messageobj);
        }
        else {
          socket.broadcast.emit(this.appspace+'server message', messageobj);
        }
      }
      if(messageLocal != null) {
        var messageobj = {'message':messageLocal};
        socket.emit(this.appspace+'server message', messageobj);
      }
    },
    addUserToRoom: function(socketID,app,io,socket,roomname) {
      if(typeof this.clients[socketID] === "undefined")       return;

      socket.join(roomname);
      this.clients[socketID].roomname = roomname;
      socket.emit(this.appspace+'loaded room', {'roomname':roomname});

      var fetchname = this.getClientName(socketID);
      this.sendServerMessage(socketID,app,io,socket,roomname,
        "You have joined room '"+roomname+"'.",
        fetchname+" has joined the room.");

      this.sendClientList(app, io, socket, roomname);
    },
    dropUserFromRoom: function(socketID,app,io,socket) {
      var roomname = this.clients[socketID].roomname;

      var fetchname = this.getClientName(socketID);
      this.sendServerMessage(socketID,app,io,socket,roomname,
        "You have left room '"+roomname+"'.",
        fetchname+" has left the room.");

      socket.leave(roomname);
      this.clients[socketID].roomname = null;
      this.sendClientList(app, io, socket, roomname);
    },
    getDomain: function(socket) {
      var domain = socket.handshake.headers.host;
      domain = domain.match(/^[^:]*[^:]?/g)+"";
      if(domain.match(/^www\./g))    domain = domain.substr(4);
      return domain;
    },
    getDefaultRoom: function(domain) {
      if(domain == "manaofmana.com")   return "ManaOfMana";
      if(domain == "weaponsbloom.com")   return "WeaponsBloom";
      if(domain == "gwbloom.com")        return "GWBloom";
      if(domain == "junkbumps.com")        return "JunkBumps";
      return "WeaponsBloom";
    },
    getClientList: function(roomname) {
      var list = [];
      for(item in this.clients) {
          if(typeof roomname === "string" && this.clients[item].roomname !== roomname)
              continue;
          var client = {};

          if( typeof this.clients[item].displayname !== "undefined") {
              client.displayname=this.clients[item].displayname;
          }
          else if(typeof this.clients[item].username !== "undefined") {
              client.username=this.clients[item].username;
          }
          else if(typeof this.clients[item].tempname !== "undefined") {
              client.tempname=this.clients[item].tempname;
          }
          if(this.clients[item].status)      client.status = this.clients[item].status;

          list.push(client);
      }
      return list;
    },
    getClientName: function(socketID) {
      var client = this.clients[socketID];
      if(typeof client === "undefined" || client == null)     return;

      if(typeof client.displayname !== "undefined")       return client.displayname;
      else if(typeof client.username !== "undefined")     return client.username;
      else if(typeof client.tempname !== "undefined")     return client.tempname;
    },
    updateClientName: function(socketID,socket) {
      this.clients[socketID].username = socket.request.user.username;
      this.clients[socketID].displayname = socket.request.user.displayname;
    },
    deAuthClient: function(socketID, socket,app,io) {
      if(typeof this.clients[socketID].userid === "undefined")    return;

      var fetchname1 = this.getClientName(socketID);
      var roomname = this.clients[socketID].roomname;

      if(typeof this.clients[socketID].isauthed !== "undefined")     delete this.clients[socketID].isauthed;
      if(typeof this.clients[socketID].status !== "undefined") {
        if(typeof this.clients[socketID].status.isauthed !== "undefined")      delete this.clients[socketID].status.isauthed;
      }
      if(typeof this.clients[socketID].deauthed === "undefined")     this.clients[socketID].deauthed = true;


      if(typeof this.clients[socketID].user !== "undefined")            delete this.clients[socketID].user;
      if(typeof this.clients[socketID].displayname !== "undefined")     delete this.clients[socketID].displayname;
      if(typeof this.clients[socketID].username !== "undefined")        delete this.clients[socketID].username;
/*
      if(typeof this.clients[socketID].userid !== "undefined")          delete this.clients[socketID].userid;
/**/

      this.sendClientList(app, io, socket, roomname);

      var obj = {type:'server message'};

/*        if(true) {
          var obj = {message:{type:'server message'}};
          obj.message.message = "You have logged out of the main site.  Your chat name has been changed to: "+fetchname2;

          io.emit(this.appspace+'server message', obj);     // sends only to connected client
          io.emit(this.appspace+'loaded name',{message:fetchname2});

          obj.message.message = fetchname1+" has changed to: "+fetchname2;
          io.room(this.clients[socketID].roomname).broadcast(this.appspace+'server message', obj);        // sends only to connected client
          this.sendClientList(this.clients[socketID].roomname);
      } /**/
    },
    upAuthClient: function(socketID, socket,app,io) {
      return;
        this.clients[socketID].isauthed = true;
        var roomname = this.clients[socketID].roomname;

        var fetchname1 = this.getClientName(socketID);
          this.clients[socketID].userid = socket.request.user._id;

          this.clients[socketID].user={};
          this.clients[socketID].user.email = socket.request.user.email;
          this.clients[socketID].user.username = socket.request.user.username;
          this.clients[socketID].user.id = socket.request.user._id;

        this.updateClientName(socketID,socket);

        var fetchname2 = this.getClientName(socketID);

        if(fetchname1 !== fetchname2) {

          this.sendServerMessage(socketID,app,io,socket,roomname,
            "Your user profile has loaded.  Your chat name has been changed to: "+fetchname2,
            "'"+fetchname1+"' has changed their chat name to: '"+fetchname2+"'.");

          if(fetchname2 !== this.clients[socketID].username) {
              this.clients[socketID].displayname = fetchname2;
          } else if(typeof this.clients[socketID].username === "string") {
              delete this.clients[socketID].displayname;
          }
          this.sendClientList(app, io, socket, roomname);
        }
    },
    sendClientList: function(app, io, socket, roomname) {
      for (id in this.clients) {
        var client = this.clients[id];
        if( (roomname == null) || (client.roomname == roomname) ) {

          if(roomname != null) {
            io.in(roomname).emit(  this.appspace+'user list',  this.getClientList(roomname)  );
          }
          else {
            socket.broadcast.emit(this.appspace+'user list',  this.getClientList(roomname)  );
            io.emit(this.appspace+'user list',  this.getClientList(roomname)  );
          }

        }
      }
    },
    end: function(app, io, socket, roomkeeper) {
      var socketID = socket.id;
      if(typeof this.clients[socketID] === "undefined")  return;
      var roomname = this.clients[socketID].roomname;

      this.dropUserFromRoom(socketID,app,io,socket);
      this.dropUser(socketID,app,io,socket);
      this.sendClientList(app, io, socket, roomname);
    },


    init: function(app, io, socket, basepath, roomkeeper) {
      this.app = app;
      this.io = io;
      this.basepath = basepath;

      socket.on(this.appspace+'connection', function(msg) {

          var socketID = socket.id;
          console.log('connected: ',socketID);

          var client = this.addUser(socketID,app,io,socket);

          var domainstr = this.getDomain(socket);
          var defroom = this.getDefaultRoom(domainstr);

          this.addUserToRoom(socketID,app,io,socket,defroom);
      }.bind(this));
      socket.on(this.appspace+'disconnect', function(msg) {
        var socketID = socket.id;
        console.log('disconnect',socketID);

          var client = this.dropUser(socketID,app,io,socket);
          this.sendClientList(app, io, socket, client.roomname);
      }.bind(this));
      socket.on(this.appspace+'heartbeat', function(msg) {
          var socketID = socket.id;

          var d = new Date();
          this.clients[socketID].time = d.getTime();
          if( this.clients[socketID].status ) {
            if( this.clients[socketID].status.dropping )     delete this.clients[socketID].status.dropping;
          }

          var checkAuth=false;
      }.bind(this));


      socket.on(this.appspace+'chat message', function(msg) {
        var socketID = socket.id;
        if(typeof this.clients[socketID] === "undefined")  return;

        var msgname = this.getClientName(socketID);
        var user = false;

        if( typeof this.clients[socketID] !== 'undefined') {
            if(typeof this.clients[socketID].username !== 'undefined') {
                if(msgname == this.clients[socketID].username) {
                    user = true;
                }
            }
        }

        var packet = {};
        packet.message = msg.message;
        packet.username = msgname;
        packet.user = user;


        var roomname = this.clients[socketID].roomname;
        io.in(roomname).emit(this.appspace+'chat message', packet );

      }.bind(this));
      socket.on(this.appspace+'change room', function(msg) {
        var socketID = socket.id;
        if(typeof this.clients[socketID] === "undefined")  return;

        var domainstr = this.getDomain(socket);
        var defroom = this.getDefaultRoom(domainstr);
        if(domainstr == "junkbumps.com")  return;
        if(defroom == "JunkBumps")  return;

        var oldroomname = this.clients[socketID].roomname;
        var newroomname = msg.roomname;

        this.dropUserFromRoom(socketID,app,io,socket);
        this.addUserToRoom(socketID,app,io,socket,newroomname);

        this.sendServerMessage(socketID,app,io,socket,newroomname,
          "You have changed your chat room from '"+oldroomname+"' to: "+newroomname,
          null);


      }.bind(this));
      socket.on(this.appspace+'change name', function(msg) {
        var socketID = socket.id;

        var msgname = this.getClientName(socketID);
        var changedname = msg.name;
        if(typeof this.clients[socketID].username !== 'undefined') {
            if(typeof changedname === "undefined")  changedname = this.clients[socketID].username;
            if(changedname.match(/^\s*$/g))         changedname = this.clients[socketID].username;
        }
        else {
            if(typeof changedname === "undefined")  changedname = this.getClientName(socketID);
            if(changedname.match(/^\s*$/g))         changedname = this.getClientName(socketID);
        }



        var roomname = this.clients[socketID].roomname;
        var fetchname = this.getClientName(socketID);

        this.sendServerMessage(socketID,app,io,socket,roomname,
          "You have changed your chat name to: "+changedname,
          "'"+msgname+"' has changed their chat name to: '"+changedname+"'.");

        if(changedname !== this.clients[socketID].username) {
            this.clients[socketID].displayname = changedname;
        } else if(typeof this.clients[socketID].username === "string") {
            delete this.clients[socketID].displayname;
        }
        this.sendClientList(app, io, socket, roomname);
      }.bind(this));
    }
};

module.exports = ExpressChatApp;
