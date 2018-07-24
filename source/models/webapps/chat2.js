
var ExpressChatApp = {

    app: undefined,
    appname: 'expresschat',
    appspace: 'expresschat-',
    usercount: 0,
    interval: 3000,
    clients: {},

    intervalFn: function() {
        this.heartbeat();
    },

    heartbeat: function() {
        var obj = {message:{type:'heartbeat'}};
/*        for(item in this.clients) {
            this.clients[item].socket.emit(this.appspace+'heartbeat', obj);
            var d = new Date();
            this.clients[item].time = d.getTime();
            this.checkbeat(item);
        } /**/
    },
    checkbeat: function(sockid) {
/*        var d = new Date();
        var deltatime = d.getTime() - this.clients[sockid].time;
        if( deltatime >= (this.interval*6) ) {
            this.dropUser(undefined, sockid);
        }
        else if( deltatime >= (this.interval*3) ) {
            if(!this.clients[sockid].status.dropping) {
                var roomname = this.clients[sockid].roomname;

                this.clients[sockid].status.dropping = true;
                this.sendClientList(this.app,roomname);
            }
        } /**/
    },
    dropUser: function(req, sockid) {
        var fetchname = this.getClientName(sockid);
        var roomname = this.clients[sockid].roomname;
        delete this.clients[sockid];
        this.sendClientList(this.app,roomname);

        var obj = {message:{type:'server message'}};
/*
        if(typeof req === "undefined") {
            console.log('user dropped: ' + sockid);
            obj.message.message = fetchname+" has dropped.";
            this.app.io.room(roomname).broadcast(this.appspace+'server message', obj);
        }
        else {
            console.log('user disconnected: ' + sockid);
            obj.message.message = fetchname+" has disconnected.";
            req.io.room(roomname).broadcast(this.appspace+'server message', obj);
        } /**/
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
    getClientName: function(sockid) {
        var client = this.clients[sockid];
        if(typeof client === "undefined" || client == null)     return;

        if(typeof client.displayname !== "undefined")       return client.displayname;
        else if(typeof client.username !== "undefined")     return client.username;
        else if(typeof client.tempname !== "undefined")     return client.tempname;
    },
    updateClientName: function(sockid) {
        var fetch = this.getClientName(sockid);

        var client = this.clients[sockid];
        if(typeof client === "undefined" || client == null)     return;

        if(client.user) {
            if(typeof client.user.displayname === "undefined" || client.user.displayname == "" || client.user.displayname == client.user.username)
            { }
            else {
                this.clients[sockid].displayname = client.user.displayname;
            }
            this.clients[sockid].username = client.user.username;
        }
    },
    checkIfAuth: function(req,app) {
/*        var User = require('../../app/models/usermodels/user');
        if(req.session.passport && req.session.passport.user) {
            User.findOne({'_id' : req.session.passport.user }, function(err, user) {
                if(err) {
                    console.log( JSON.stringify(err) );
                }
                if(user) {
                    this.upAuthClient(req.socket.id, user, req,app);
                }
            }.bind(this));
        }   /**/
    },
    deAuthClient: function(io, sockid) {
        var fetchname1 = this.getClientName(sockid);

        if(typeof this.clients[sockid].status.auth !== "undefined")     delete this.clients[sockid].status.auth;

        if(typeof this.clients[sockid].user !== "undefined")            delete this.clients[sockid].user;
        if(typeof this.clients[sockid].userid !== "undefined")          delete this.clients[sockid].userid;
        if(typeof this.clients[sockid].displayname !== "undefined")     delete this.clients[sockid].displayname;
        if(typeof this.clients[sockid].username !== "undefined")        delete this.clients[sockid].username;

        this.usercount = this.usercount+1;
        var fetchname2 = "User "+this.usercount;
        this.clients[sockid].tempname = fetchname2;

        var obj = {message:{type:'server message'}};

/*        if(true) {
            var obj = {message:{type:'server message'}};
            obj.message.message = "You have logged out of the main site.  Your chat name has been changed to: "+fetchname2;

            io.emit(this.appspace+'server message', obj);     // sends only to connected client
            io.emit(this.appspace+'loaded name',{message:fetchname2});

            obj.message.message = fetchname1+" has changed to: "+fetchname2;
            io.room(this.clients[sockid].roomname).broadcast(this.appspace+'server message', obj);        // sends only to connected client
            this.sendClientList(this.clients[sockid].roomname);
        } /**/
    },
    upAuthClient: function(sockid, user, req,app) {
/*
        this.clients[sockid].status.auth = true;

        var fetchname1 = this.getClientName(sockid);

        this.clients[sockid].user = user;
        this.clients[sockid].userid = user._id;

        this.updateClientName(sockid);

        var fetchname2 = this.getClientName(sockid);

        if(fetchname1 !== fetchname2) {

            var obj = {message:{type:'server message'}};
            obj.message.message = "Your user profile has loaded.  Your chat name has been changed to: "+fetchname2;

            req.io.emit(this.appspace+'server message', obj);     // sends only to connected client
            req.io.emit(this.appspace+'loaded name',{message:fetchname2});

            obj.message.message = fetchname1+" has changed to: "+fetchname2;
            req.io.room(this.clients[sockid].roomname).broadcast(this.appspace+'server message', obj);        // sends only to connected client
            this.sendClientList(app,this.clients[sockid].roomname);

        } /**/
    },
    sendClientList: function(app, roomname) {
//        app.io.room(roomname).broadcast(this.appspace+'user list', {message:this.getClientList(roomname)});
    },

    init: function(app, roomkeeper) {
        this.app = app;
/*
        app.io.route(this.appspace+'connection', function(req) {
            if(typeof this.clients[req.socket.id] === "undefined")       this.clients[req.socket.id]={};

            req.session.name = req.data;
            req.session.save();


            var domain = req.headers.host;
            domain = domain.match(/^[^:]*[^:]?/g)+"";
            if(domain.match(/^www\./g))    domain = domain.substr(4);

            var room = this.getDefaultRoom(domain);
            var roomname = roomkeeper.getRoomName(this.appname, room, '');
            roomkeeper.addToRoom(roomname, req.socket);
            this.clients[req.socket.id].room = room;
            this.clients[req.socket.id].roomname = roomname;

            var d = new Date();

            this.usercount = this.usercount+1;
            this.clients[req.socket.id].io = req.io;
            this.clients[req.socket.id].socket = req.socket;
            this.clients[req.socket.id].time = d.getTime();
            this.clients[req.socket.id].status = {};

            req.io.emit(this.appspace+'loaded room',{message:room});
            req.io.join(roomname);


            this.checkIfAuth(req,app);


            this.updateClientName(req.socket.id);
            var fetchname = this.getClientName(req.socket.id);

            if(typeof fetchname === "undefined") {
                fetchname = "User "+this.usercount;
                this.clients[req.socket.id].tempname = fetchname;
            }

            req.io.emit(this.appspace+'starting name',{message:fetchname});


            var obj = {message:{type:'server message'}};
            obj.message.message = "You have connected.";
            req.io.emit(this.appspace+'server message',obj);

            obj.message.message = fetchname+" has connected.";
            req.io.room(this.clients[req.socket.id].roomname).broadcast(this.appspace+'server message', obj);

            console.log(fetchname+' connected to chat: ' + req.socket.id);

            this.sendClientList(app,this.clients[req.socket.id].roomname);

            req.socket.on('disconnect', function(){
                this.dropUser(req, req.socket.id);
            }.bind(ExpressChatApp) );

        }.bind(ExpressChatApp) );
        app.io.route(this.appspace+'chat message', function(req){
            var msg = req.data;

            var msgname = this.getClientName(req.socket.id);
            var user = false;

            if( typeof this.clients[req.socket.id] !== 'undefined') {
                if(typeof this.clients[req.socket.id].user !== 'undefined') {
                    console.log(  msgname+' == '+ this.clients[req.socket.id].user.username );
                    if(msgname == this.clients[req.socket.id].user.username) {
                        user = true;
                    }
                }
            }

            msg.username = msgname;
            msg.user = user;

            app.io.room(this.clients[req.socket.id].roomname).broadcast(this.appspace+'chat message', msg);
        }.bind(ExpressChatApp) );
        app.io.route(this.appspace+'heartbeat', function(req){
            var d = new Date();
            this.clients[req.socket.id].time = d.getTime();
            if( this.clients[req.socket.id].status.dropping )     delete this.clients[req.socket.id].status.dropping;

            if(typeof this.clients[req.socket.id].user === "undefined") {
                if(req.session && req.session.passport && req.session.passport.user) {
                    console.log('escalate user '+req.socket.id+' => '+req.session.passport.user.username);
                    this.checkIfAuth(req,app);
                }
            }
            else if(typeof this.clients[req.socket.id].user !== "undefined") {
                if(typeof req.session === "undefined" || typeof req.session.passport === "undefined" || typeof req.session.passport.user === "undefined") {
                    console.log('de-escalate user '+req.socket.id+' => '+this.clients[req.socket.id].user.username);
                    delete this.clients[req.socket.id].user;
                    delete this.clients[req.socket.id].username;
                    this.sendClientList(app,this.clients[req.socket.id].roomname);
                }
            }
        }.bind(ExpressChatApp) );
        app.io.route(this.appspace+'change name', function(req) {

            var changedname = req.data.message;
            if(typeof this.clients[req.socket.id].user !== "undefined" && typeof this.clients[req.socket.id].user.username !== 'undefined') {
                if(typeof changedname === "undefined")  changedname = this.clients[req.socket.id].user.username;
                if(changedname.match(/^\s*$/g))         changedname = this.clients[req.socket.id].user.username;
            }
            else {
                if(typeof changedname === "undefined")  changedname = this.getClientName(req.socket.id);
                if(changedname.match(/^\s*$/g))         changedname = this.getClientName(req.socket.id);
            }



            var obj = {message:{type:'server message'}};
            obj.message.message = "You have changed your chat name to: "+changedname;

            req.io.emit(this.appspace+'server message', obj);     // sends only to connected client
            obj.message.message = this.getClientName(req.socket.id)+" has changed their chat name to: "+changedname;
            req.io.room(this.clients[req.socket.id].roomname).broadcast(this.appspace+'server message', obj);        // sends only to connected client

            if(changedname !== this.clients[req.socket.id].username) {
                this.clients[req.socket.id].displayname = changedname;
            } else if(typeof this.clients[req.socket.id].username === "string") {
                delete this.clients[req.socket.id].displayname;
            }
            this.sendClientList(app,this.clients[req.socket.id].roomname);
        }.bind(ExpressChatApp) );
        app.io.route(this.appspace+'change room', function(req) {

            var domain = req.headers.host;
            domain = domain.match(/^[^:]*[^:]?/g)+"";
            if(domain.match(/^www\./g))    domain = domain.substr(4);
            if(domain === "junkbumps.com")      return;

            var obj = {message:{type:'server message'}};
            obj.message.message = "You have changed your chat room to: "+req.data.message;

            req.io.emit(this.appspace+'server message', obj);     // sends only to connected client
            obj.message.message = this.getClientName(req.socket.id)+" has left the room";
            req.io.room(this.clients[req.socket.id].roomname).broadcast(this.appspace+'server message', obj);        // sends only to connected client
            req.io.leave(this.clients[req.socket.id].roomname);

            var oldroomname = this.clients[req.socket.id].roomname;
            var room = req.data.message;
            var roomname = roomkeeper.getRoomName(this.appname, room, '');
            roomkeeper.addToRoom(roomname, req.socket);
            this.clients[req.socket.id].room = room;
            this.clients[req.socket.id].roomname = roomname;

            req.io.join(roomname);

            this.sendClientList(app,roomname);
            this.sendClientList(app,oldroomname);

            obj.message.message = this.getClientName(req.socket.id)+" has joined the room";
            req.io.room(this.clients[req.socket.id].roomname).broadcast(this.appspace+'server message', obj);        // sends only to connected client

            req.io.emit(this.appspace+'loaded room',{message:room});

        }.bind(ExpressChatApp) );
        /**/
    }
};

module.exports = ExpressChatApp;
