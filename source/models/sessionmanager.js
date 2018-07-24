//	Session Manager

module.exports = {

	clients: {},
	appcontroller: undefined,
//	timeout: (45*1000*60),
  timeout: (15*1000),

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
                  //  ******   FIX THIS!!
//									if(client.time > lasttime)		lasttime = client.time;
								}
							}
						}
					}
				}
			}

      var d = new Date();
      var deltatime = d.getTime() - lasttime;


			if(this.timeout <= deltatime) {
				this.dropClient(i);
			}
		}
	},
	addClient: function (id, user, req) {
    console.log('add client: '+id);
		this.clients[id] = {user:user, socketid:req.socket.id, socket:req.socket, drop:false};
		this.updateTime(id);
    this.authClientInApps(id);
	},
  updateClient: function (id, user, req) {
    console.log('update client:',id);
//    if(this.clients[id].socket)		this.clients[id].socket=req.socket;
		this.updateTime(id);
	},
  logoutClient: function (id, req) {
    req.logout();
    this.clients[id].drop = false;
    delete this.clients[id];
    console.log('client session deauthed: '+id);
    console.log('deauth test:', req.isAuthenticated());
  },
	dropClient: function (id) {
		if(typeof this.clients[id] !== "undefined") {
      	if(this.clients[id] && this.clients[id].user) {
            console.log('client session dropout: '+id);
            this.clients[id].drop = true;
  					if(this.clients[id].user)	  delete this.clients[id].user;
		    }
  	}
		this.dropClientFromApps(id);
	},
	dropClientFromApps: function(id) {
		if(typeof this.appcontroller !== 'undefined') {
			for(j in this.appcontroller.registeredapps) {
				var subapp = this.appcontroller.registeredapps[j];
				if(typeof subapp.clients !== "undefined") {
					for(k in subapp.clients) {
						var client = subapp.clients[k];
						if(typeof client.userid !== 'undefined' && String(client.userid) == String(id)) {
							subapp.deAuthClient(k, subapp.clients[k].socket,subapp.app,subapp.io);
						}
					}
				}
			}
		}
 	},
  authClientInApps: function(id) {
    return;
		if(typeof this.appcontroller !== 'undefined') {
			for(j in this.appcontroller.registeredapps) {
				var subapp = this.appcontroller.registeredapps[j];
				if(typeof subapp.clients !== "undefined") {
					for(k in subapp.clients) {
						var client = subapp.clients[k];
            // CLIENT.USERID doesn't exist!  How should we upauth this?
						if(typeof client.userid !== 'undefined' && client.userid == id) {
//							subapp.upAuthClient(k, subapp.clients[k].socket,subapp.app,subapp.io);
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

//        console.log('update: '+id+': '+this.clients[id].time);
	}

};
