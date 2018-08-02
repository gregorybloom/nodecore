//	Session Manager

module.exports = {

	clients: {},
	socketset: {},
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
		for(i in this.socketset) {
			if(typeof this.socketset[i] !== "undefined") {
				for(id in this.socketset[i]) {
					var checksocket = this.socketset[i][id].socket;
					var appspace = 'website-';
					checksocket.emit(appspace+'heartbeat', {type:'heartbeat'});
				}
			}
		}
		var d = new Date();
		for(i in this.socketset) {
			if(typeof this.socketset[i] !== "undefined") {
				for(id in this.socketset[i]) {
					var deltaTime = d.getTime() - this.socketset[i][id].connectedTime;
					if(this.socketset[i][id] && deltaTime > 1000*60*2) {
						delete this.socketset[i][id];
					}
				}
			}
		}



		for(i in this.appcontroller.registeredapps) {
			var name = i;
			var app = this.appcontroller.registeredapps[name];
			if(app.interval && app.intervalFn && app.interval >= 1000) {
				app.intervalFn.call(app);
			}
		}



		for(i in this.clients) {
      if(this.clients[i] && !this.clients[i].user)    continue;

			var lasttime = this.clients[i].activityTime;

			if(typeof this.appcontroller !== 'undefined') {
				for(j in this.appcontroller.registeredapps) {
					if(typeof this.appcontroller.registeredapps[j].clients !== "undefined") {
						for(k in this.appcontroller.registeredapps[j].clients) {
							var client = this.appcontroller.registeredapps[j].clients[k];
							if(typeof client.userid !== 'undefined' && client.userid == i) {
								if(typeof client.activityTime !== "undefined") {
									if(client.activityTime > lasttime)		lasttime = client.activityTime;
								}
							}
						}
					}
				}
			}
			if(lasttime > this.clients[i].activityTime) {
				this.clients[i].activityTime = lasttime;
			}

      var d = new Date();
      var deltatime = d.getTime() - lasttime;

			if(this.timeout <= deltatime) {
				this.removeClient(i);
				continue;
			}


			var sessionID = this.clients[i].sessionID;
			if(typeof this.socketset[sessionID] !== "undefined") {
				var defunct = true;
				var c = 0;
				for(id in this.socketset[sessionID]) {
					if(this.socketset[sessionID][id]) {
						defunct=false;
						c=c+1;
//						break;
					}
				}
				console.log(i,',',sessionID,'=',c,defunct);
				if(defunct) {
					this.removeClient(i);
					continue;
				}
			}
		}
	},
	addClient: function (id, user, req) {
    console.log('add client: '+id,',',req.sessionID);
//		this.clients[id] = {user:user, socketid:req.socket.id, socket:req.socket, sessionID:req.sessionID, drop:false};
		this.clients[id] = {user:user, sessionID:req.sessionID, drop:false};
		this.clients[id]['socketlist'] = {};
		this.clients[id]['socketlist'][req.socket.id] = {socket:req.socket};

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
				if(this.clients[userID].sessionID) {
					for(id in this.socketset[this.clients[userID].sessionID]) {
						if(!this.socketset[this.clients[userID].sessionID]) {
							delete this.socketset[this.clients[userID].sessionID];
						}
					}
				}

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
        this.clients[id].activityTime=d.getTime();
	}

};
