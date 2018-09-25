module.exports = {

		registeredapps: {},
		intervalfns: {},
		corepath: null,

		addApp: function (appname, app, appconf, app_path, webapp, io, express, basepath) {
				this.registeredapps[appname] = {appclass:app};

				if(app.interval && app.intervalFn && app.interval >= 1000) {
						this.intervalfns[appname] = app.intervalFn.bind(app);
				}
				if(typeof app.addExpressRoutes === "function") {
						app.addExpressRoutes(appname,appconf,app_path,webapp,express);
				}
				this.initializeApp(appname, app, appconf, webapp, io, express, basepath);

				var staticpath = app_path + appconf['paths']['static'];
		    webapp.use('/apps/static/'+appname, express.static(staticpath) );
		},
		initializeApp: function (appname, app, appconf, webapp, io, express, basepath) {
				if(typeof appconf['dbconf'] !== "undefined") {


				}

				var appInstance = this.registeredapps[appname].appclass.alloc();
				this.registeredapps[appname].instance = appInstance;
				appInstance.setup(webapp, io, express, basepath);
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

		appbasepath += "source/";

    var appcorepath = appbasepath + appconf['paths']['core'];
    return {appcorepath:appcorepath,appconf:appconf,appbasepath:appbasepath};
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

			var newbasepath = "";
	    var fetchobj = this.fetchAppPath(appname,configattr);
			if(fetchobj == null)			      res.redirect('/404');

			newbasepath += fetchobj.appbasepath;
	    newbasepath += confpath['paths']['view'];

			console.log(newbasepath);
	    res.sendFile(newbasepath);
  }


};
