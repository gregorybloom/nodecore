module.exports = {

		registeredapps: {},
		intervalfns: {},
		corepath: null,

		addApp: function (appname, app, app_pathobj, webapp, io, express, serverApp) {
				this.registeredapps[appname] = {appclass:app};

				if(app.interval && app.intervalFn && app.interval >= 1000) {
						this.intervalfns[appname] = app.intervalFn.bind(app);
				}
				if(typeof app.addExpressRoutes === "function") {
						app.addExpressRoutes(appname,app_pathobj,webapp,express);
				}
				this.initializeApp(appname, app, app_pathobj, webapp, io, express, serverApp);

				if(typeof app_pathobj['appconf']['paths']['static'] !== "undefined") {
					var staticpath = app_pathobj['appsourcepath'] + app_pathobj['appconf']['paths']['static'];
					webapp.use('/apps/'+appname+'/static/', express.static(staticpath) );
				}
		},
		initializeApp: function (appname, app, app_pathobj, webapp, io, express, serverApp) {
				var mongooseDB = null;

				if(typeof app_pathobj['appconf']['paths']['dbconf'] !== "undefined") {
						var configDB = require(app_pathobj['appbasepath'] + '/' + app_pathobj['appconf']['paths']['dbconf']);

						var dbUrl = 'mongodb://';
						dbUrl += configDB['userdb'].dbstore.username + ':' + configDB['userdb'].dbstore.password + '@';
						dbUrl += configDB['userdb'].dbstore.hostaddr + ':' + configDB['userdb'].dbstore.port + '/' + configDB['userdb'].dbstore.dbname;
						configDB['userdb'].dbstore.url = dbUrl;
						console.log('-2-',dbUrl);

						mongooseDB = new serverApp.mongooseClass();
						mongooseDB.connect(dbUrl);

						console.log('new DB');
				}
				else {
						mongooseDB = serverApp.mainMongooseDB;
				}

				var appInstance = this.registeredapps[appname].appclass.alloc();
				this.registeredapps[appname].instance = appInstance;
				appInstance.setup(webapp,io,express,serverApp,app_pathobj,mongooseDB);
		},


	fetchAppPath: function(appname,configattr) {
    if(typeof configattr['apps']['appsconf'][appname] === "undefined")       return null;
    if(typeof configattr['apps']['appsconf'][appname]['paths'] === "undefined")       return null;

    var appconf = configattr['apps']['appsconf'][appname];

		var appbasepath = this.corepath + "/fullapps/";

    if(typeof appconf['private'] !== "undefined" && appconf['private'] == true) {
			appbasepath += "/privateapps/";
    }
    else {
			appbasepath += "/publicapps/";
    }
		appbasepath += appname+"/";

		var appsourcepath = appbasepath + "source/";

    var appcorepath = appsourcepath + appconf['paths']['core'];
    return {appcorepath:appcorepath,appsourcepath:appsourcepath,appconf:appconf,appbasepath:appbasepath};
  },


	serveAppView: function(res,appname,configattr) {
	    if(typeof configattr['apps']['appsconf'][appname] === "undefined") {
	      res.redirect('/404');
	      return;
	    }
	    if(typeof configattr['apps']['appsconf'][appname]['paths'] === "undefined") {
	      res.redirect('/404');
	      return;
	    }

	    var confpath = configattr['apps']['appsconf'][appname];

			var appviewpath = "";
	    var fetchobj = this.fetchAppPath(appname,configattr);
			if(fetchobj == null)			      res.redirect('/404');

			appviewpath += fetchobj.appsourcepath;
	    appviewpath += confpath['paths']['view'];

			console.log(appviewpath);
	    res.sendFile(appviewpath);
  }


};
