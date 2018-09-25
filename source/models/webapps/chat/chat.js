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
module.exports = function(AppClass){
    function ExpressChatApp() {
    }
    ExpressChatApp.prototype = new AppClass;
    ExpressChatApp.prototype.init = function() {
        AppClass.prototype.init.call(this);

        this.appname = 'expresschat';
        this.appspace = 'expresschat-';
        this.usercount = 0;
        this.interval = 3000;
    };

    ExpressChatApp.prototype.intervalFn = function() {
        AppClass.prototype.intervalFn.call(this);
        this.sendHeartbeat();
    };
    ExpressChatApp.prototype.sendHeartbeat = function() {
        var obj = {type:'heartbeat'};
        for(sockid in this.clients) {
            this.clients[sockid].socket.emit(this.appspace+'heartbeat', obj);
            var d = new Date();
            this.checkbeat(sockid);
        }
    };
    ExpressChatApp.prototype.checkbeat = function(sockid) {
        return;
        /*
        var d = new Date();
        if(typeof this.clients[sockid].activityTime === "undefined")    this.clients[sockid].activityTime = d.getTime();
        var socket = this.clients[sockid].socket;

        var deltatime = d.getTime() - this.clients[sockid].activityTime;
        if( deltatime >= (this.interval*6) ) {
        this.dropUser(sockid,socket);
        }
        else if( deltatime >= (this.interval*3) ) {
        if(typeof this.clients[sockid].status === "undefined" || !this.clients[sockid].status.dropping) {
        var roomname = this.clients[sockid].roomname;

        if(typeof this.clients[sockid].status === "undefined")      this.clients[sockid].status={};
        this.clients[sockid].status.dropping = true;
        this.sendClientList(socket,roomname);
        }
        }     /**/
    };
    ExpressChatApp.prototype.addUser = function(socketID,socket) {
        this.clients[socketID].sessionID = socket.request.sessionID;

        this.updateClientName(socketID,socket);
        this.clients[socketID].tempname = 'Guest ('+socketID.substring(0,8)+')';


        AppClass.prototype.addUser.call(this,socketID,socket);


        var fetchname = this.getClientName(socketID);
        this.sendServerMessage(socketID,socket,null,
        "You have connected.",
        fetchname+" has connected.");

        var nameobj = this.getClientName(socketID,true);
        socket.emit(this.appspace+'loaded name',nameobj);

        return this.clients[socketID];
    };
    ExpressChatApp.prototype.dropUser = function(socketID,socket) {
        if(typeof this.clients[socketID] === "undefined")       return;

        var fetchname = this.getClientName(socketID);
        this.sendServerMessage(socketID,socket,null,
        null,
        fetchname+" has disconnected.");

        AppClass.prototype.dropUser.call(this,socketID,socket);
    };
    ExpressChatApp.prototype.sendServerMessage = function(socketID,socket,roomname,messageLocal,messageOther) {
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
    };
    ExpressChatApp.prototype.addUserToRoom = function(socketID,socket,roomname) {
        if(typeof this.clients[socketID] === "undefined")       return;

        AppClass.prototype.addUserToRoom.call(this,socketID,socket,roomname);


        socket.emit(this.appspace+'loaded room', {'roomname':roomname});

        var fetchname = this.getClientName(socketID);
        this.sendServerMessage(socketID,socket,roomname,
        "You have joined room '"+roomname+"'.",
        fetchname+" has joined the room.");

        this.sendClientList(socket, roomname);
    };
    ExpressChatApp.prototype.dropUserFromRoom = function(socketID,socket) {
        var roomname = this.clients[socketID].roomname;

        var fetchname = this.getClientName(socketID);
        this.sendServerMessage(socketID,socket,roomname,
        "You have left room '"+roomname+"'.",
        fetchname+" has left the room.");

        AppClass.prototype.dropUserFromRoom.call(this,socketID,socket);


        this.sendClientList(socket, roomname);
    };
    ExpressChatApp.prototype.getDomain = function(socket) {
        var domain = socket.handshake.headers.host;
        domain = domain.match(/^[^:]*[^:]?/g)+"";
        if(domain.match(/^www\./g))    domain = domain.substr(4);
        return domain;
    };
    ExpressChatApp.prototype.getDefaultRoom = function(domain) {
        if(domain == "manaofmana.com")   return "ManaOfMana";
        if(domain == "weaponsbloom.com")   return "WeaponsBloom";
        if(domain == "gwbloom.com")        return "GWBloom";
        if(domain == "junkbumps.com")        return "JunkBumps";
        return "WeaponsBloom";
    };
    ExpressChatApp.prototype.getClientName = function(socketID,loadobj) {
        var client = this.clients[socketID];
        if(typeof client === "undefined" || client == null)     return;

        if(typeof client.tempname == "undefined") {
        if(!this.clients[socketID].isauthed)              client.tempname = 'Guest ('+socketID.substring(0,8)+')';
        }


        if(loadobj == true || loadobj == "true") {
        if(!this.clients[socketID].isauthed)                return {'tempname':client.tempname};
        else if(typeof client.tempname !== "undefined")     return {'tempname':client.tempname};

        if(typeof client.displayname !== "undefined") {
        if(typeof client.username === "undefined")         return {'displayname':client.displayname};
        else if(client.displayname != client.username)     return {'displayname':client.displayname};
        else                                               return {'username':client.username};
        }
        else if(typeof client.username !== "undefined")     return {'username':client.username};
        else if(typeof client.tempname !== "undefined")     return {'tempname':client.tempname};
        }
        else {
        if(!this.clients[socketID].isauthed)                return client.tempname;
        else if(typeof client.tempname !== "undefined")     return client.tempname;

        if(typeof client.displayname !== "undefined")       return client.displayname;
        else if(typeof client.username !== "undefined")     return client.username;
        else if(typeof client.tempname !== "undefined")     return client.tempname;
        }
    };
    ExpressChatApp.prototype.updateClientName = function(socketID,socket) {
        if (typeof socket.request.user !== "undefined") {
        this.clients[socketID].username = socket.request.user.username;
        this.clients[socketID].displayname = socket.request.user.displayname;
        }
    };
    ExpressChatApp.prototype.deAuthClient = function(socketID, socket) {
        if(typeof this.clients[socketID].userid === "undefined")    return;

        var fetchname1 = this.getClientName(socketID);
        var roomname = this.clients[socketID].roomname;

        AppClass.prototype.deAuthClient.call(this,socketID, socket);


        var fetchname2 = this.getClientName(socketID);
        this.clients[socketID].tempname = fetchname2;
        if(fetchname1 !== fetchname2) {
        this.sendServerMessage(socketID,socket,roomname,
        "You have been logged out.  Your chat name has been changed to: "+fetchname2,
        "'"+fetchname1+"' has logged out.  Their name changed their chat name to: '"+fetchname2+"'.");
        }

        var nameobj = {};
        nameobj.tempname = this.clients[socketID].tempname;
        socket.emit(this.appspace+'loaded name',nameobj);

        this.sendClientList(socket, roomname);

        /*
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
    };
    ExpressChatApp.prototype.upAuthClient = function(socketID, socket, inputobj) {
        if(inputobj == null || typeof inputobj === "undefined")  inputobj = {};

        var UserSchema = require('../schema/usermodels/user.js');
        console.log("upauth client:",socketID);

        var fetchname1 = this.getClientName(socketID);
        AppClass.prototype.upAuthClient.call(this,socketID, socket, inputobj, function() {
        var subapp = ExpressChatApp;
        var roomname = this.clients[socketID].roomname;

        delete this.clients[socketID].tempname;

        var fetchname2 = this.getClientName(socketID);
        if(fetchname1 !== fetchname2) {
        this.sendServerMessage(socketID,socket,roomname,
        "Your user profile has loaded.  Your chat name has been changed to: "+fetchname2,
        "'"+fetchname1+"' has changed their chat name to: '"+fetchname2+"'.");
        }

        var nameobj = this.getClientName(socketID,true);
        socket.emit(this.appspace+'loaded name',nameobj);

        this.sendClientList(socket, roomname);
        }.bind(this));
        if(typeof this.clients[socketID].userid === "undefined")    return;
    };
    ExpressChatApp.prototype.sendClientList = function(socket, roomname) {
        for (id in this.clients) {
            var client = this.clients[id];
            if( (roomname == null) || (client.roomname == roomname) ) {

                if(roomname != null) {
                    this.io.in(roomname).emit(  this.appspace+'user list',  this.getClientList(roomname)  );
                }
                else {
                    socket.broadcast.emit(this.appspace+'user list',  this.getClientList(roomname)  );
                    this.io.emit(this.appspace+'user list',  this.getClientList(roomname)  );
                }

            }
        }
    };
    ExpressChatApp.prototype.endSocket = function(socket, roomkeeper) {
        if(typeof this.clients[socket.id] === "undefined")  return;
        var roomname = this.clients[socket.id].roomname;

        AppClass.prototype.endSocket.call(this,socket,roomkeeper);
        this.sendClientList(socket, roomname);
    };
    ExpressChatApp.prototype.initSocket = function(socket, roomkeeper) {
        //    AppClass.prototype.init.call(this,socket, roomkeeper);

        socket.on(this.appspace+'connection', function(msg) {

        var socketID = socket.id;
        console.log('connected: ',socketID, ',', socket.request.sessionID);

        var client = this.addUser(socketID,socket);

        var domainstr = this.getDomain(socket);
        var defroom = this.getDefaultRoom(domainstr);

        this.addUserToRoom(socketID,socket,defroom);
        this.sendClientList(socket, defroom);
        }.bind(this));
        socket.on(this.appspace+'disconnect', function(msg) {
        var socketID = socket.id;
        console.log('disconnected: ',socketID, ',', socket.request.sessionID);

        var client = this.dropUser(socketID,socket);
        this.sendClientList(socket, client.roomname);
        }.bind(this));
        socket.on(this.appspace+'heartbeat', function(msg) {
        var socketID = socket.id;

        var d = new Date();
        this.clients[socketID].activityTime = d.getTime();
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
        console.log(msgname,user);

        var packet = {};
        packet.message = msg.message;
        packet.username = msgname;
        packet.user = user;


        var roomname = this.clients[socketID].roomname;
        this.io.in(roomname).emit(this.appspace+'chat message', packet );

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

        this.dropUserFromRoom(socketID,socket);
        this.addUserToRoom(socketID,socket,newroomname);

        this.sendServerMessage(socketID,socket,newroomname,
        "You have changed your chat room from '"+oldroomname+"' to: "+newroomname,
        null);


        }.bind(this));
        socket.on(this.appspace+'change name', function(msg) {
        var socketID = socket.id;

        var msgname = this.getClientName(socketID);
        var changedname = msg.name;

        if(typeof this.clients[socketID].username !== 'undefined') {
        if(typeof changedname === "undefined")    delete this.clients[socketID].tempname;
        else if(changedname.match(/^\s*$/g))      delete this.clients[socketID].tempname;
        else                                      this.clients[socketID].tempname = changedname;
        }
        else {
        if(typeof changedname === "undefined")  delete this.clients[socketID].tempname;
        else if(changedname.match(/^\s*$/g))    delete this.clients[socketID].tempname;
        else                                    this.clients[socketID].tempname = changedname;
        }
        changedname = this.getClientName(socketID);

        var roomname = this.clients[socketID].roomname;
        var fetchname = this.getClientName(socketID);

        this.sendServerMessage(socketID,socket,roomname,
        "You have changed your chat name to: "+changedname,
        "'"+msgname+"' has changed their chat name to: '"+changedname+"'.");

        if(changedname !== this.clients[socketID].username) {
        //            this.clients[socketID].displayname = changedname;
        } else if(typeof this.clients[socketID].username === "string") {
        //            delete this.clients[socketID].displayname;
        }
        this.sendClientList(socket, roomname);
        }.bind(this));
    };
    ExpressChatApp.alloc = function() {
        var vc = new ExpressChatApp();
      	vc.init();
      	return vc;
    };

    return ExpressChatApp;

};
