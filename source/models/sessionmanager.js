//	Session Manager

module.exports = {

	clients: {},
	appcontroller: undefined,
	timeout: (45*1000*60),

  checkIfClientMissing: function (id, user, req) {
    if(req.isAuthenticated()) {
      if(typeof this.clients[id] === "undefined") {
        this.addClient(id, user, req);
      }
    }
	},

	checkClients: function() {

		for(i in this.clients) {
      if(this.clients[i] && !this.clients[i].user)    continue;

			var lasttime = this.clients[i].time;

			if(typeof this.appcontroller !== 'undefined') {
				for(j in this.appcontroller.registeredapps) {
					if(typeof this.appcontroller.registeredapps[j].clients !== "undefined") {
						for(k in this.appcontroller.registeredapps[j].clients) {
							var client = this.appcontroller.registeredapps[j].clients[k];
							if(typeof client.userid !== 'undefined' && client.userid == i) {
								if(typeof client.time !== "undefined") {
									if(client.time > lasttime)		lasttime = client.time;
								}
							}
						}
					}
				}
			}

      var d = new Date();
      var deltatime = d.getTime() - lasttime;

			if(this.timeout <= deltatime) {
				this.removeClient(i);
			}
		}
	},
	addClient: function (id, user, req) {
    console.log('add client: '+id,',',req.sessionID);
		this.clients[id] = {user:user, socketid:req.socket.id, socket:req.socket, sessionID:req.sessionID, drop:false};
		this.updateTime(id);
    this.authClientInApps(id,req.sessionID);
	},
  updateClient: function (id, user, req) {
    console.log('update client:',id);
		this.updateTime(id);
	},
  logoutClient: function (id, req) {
    req.logout();
    delete this.clients[id].drop;
    delete this.clients[id];
    console.log('client session deauthed: '+id);
  },
	removeClient: function (userID) {
		var sessionID = null;
		if(typeof this.clients[userID] !== "undefined") {
      	if(this.clients[userID] && this.clients[userID].user) {
            this.clients[userID].drop = true;
  					if(this.clients[userID].user)	  delete this.clients[userID].user;
						if(this.clients[userID].sessionID)	  sessionID = this.clients[userID].sessionID;
						console.log('client session dropout: '+userID,',',sessionID);
		    }
  	}
		this.deauthClientFromApps(userID,sessionID);
	},
	deauthClientFromApps: function(userID,sessionID) {
		if(typeof this.appcontroller !== 'undefined') {
			for(j in this.appcontroller.registeredapps) {
				var subapp = this.appcontroller.registeredapps[j];
				if(typeof subapp.clients !== "undefined") {
					for(k in subapp.clients) {
						var client = subapp.clients[k];
						if(typeof client.userid !== 'undefined' && String(client.userid) == String(userID)) {
							subapp.deAuthClient(k, subapp.clients[k].socket,subapp.app,subapp.io);
						}
						else if(sessionID != null && typeof sessionID !== "undefined") {
								if(typeof client.sessionID !== 'undefined' && String(client.sessionID) == String(userID,sessionID)) {
										subapp.deAuthClient(k, subapp.clients[k].socket,subapp.app,subapp.io);
								}
						}

					}
				}
			}
		}
 	},
  authClientInApps: function(userID,sessionID) {
		if(typeof this.appcontroller !== 'undefined') {
			for(j in this.appcontroller.registeredapps) {
				var subapp = this.appcontroller.registeredapps[j];
				if(typeof subapp.clients !== "undefined") {
					for(k in subapp.clients) {
						var client = subapp.clients[k];
            // CLIENT.USERID doesn't exist!  How should we upauth this?
						if(typeof client.userid !== 'undefined' && String(client.userid) == String(userID)) {
							subapp.upAuthClient(k, subapp.clients[k].socket,subapp.app,subapp.io);
						}
						else if(sessionID != null && typeof sessionID !== "undefined") {
								if(typeof client.sessionID !== 'undefined' && String(client.sessionID) == String(sessionID)) {
//							** only seems to work for the not-visited app => system creates an app instance per tab, for all apps! **
										subapp.upAuthClient(k, subapp.clients[k].socket,subapp.app,subapp.io, {user:this.clients[userID].user});
								}
						}
					}
				}
			}
		}
 	},

	hasClient: function (id) {
		return(typeof this.clients[id]!=="undefined");
	},

	updateTime: function (id) {
		if(typeof this.clients[id] === 'undefined')		return;
        var d = new Date();
        this.clients[id].time=d.getTime();
	}

};
