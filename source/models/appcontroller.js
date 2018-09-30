var fs = require('fs');
module.exports = {

		registeredapps: {},
		intervalfns: {},
		corepath: null,

		addApp: function (appname, subappclass, app_pathobj, webapp, io, express, serverApp) {
			this.registeredapps[appname] = {appclass:subappclass};
			var appInstance = this.registeredapps[appname].appclass.alloc();
	    this.registeredapps[appname].instance = appInstance;


	//    var subapp = subappclass.alloc();

		},
		initializeApp: function (appname, appclass, app_loadobj, configattr, webapp, io, express, serverApp) {

			var app = this.registeredapps[appname].instance;
			this.loadAppConfigs(appname,app,serverApp,app_loadobj,configattr);
			if(app.interval && app.intervalFn && app.interval >= 1000) {
					this.intervalfns[appname] = app.intervalFn.bind(app);
			}

			var appdataconf = app.configdata.appdataconf;
	    if(typeof appdataconf === "undefined") {
	      res.redirect('/404');
	      return;
	    }
	    if(typeof appdataconf['paths'] === "undefined") {
	      res.redirect('/404');
	      return;
	    }

				app.addExpressRoutes(appname,webapp,express,this);


				var mongooseDB = null;

				if(typeof app.configdata['appdbconf'] !== "undefined") {
						var configDB = app.configdata['appdbconf'];

						var dbUrl = 'mongodb://';
						dbUrl += configDB['userdb'].dbstore.username + ':' + configDB['userdb'].dbstore.password + '@';
						dbUrl += configDB['userdb'].dbstore.hostaddr + ':' + configDB['userdb'].dbstore.port + '/' + configDB['userdb'].dbstore.dbname;
						configDB['userdb'].dbstore.url = dbUrl;

						mongooseDB = new serverApp.mongooseClass();
						mongooseDB.connect(dbUrl);
				}
				else {
						mongooseDB = serverApp.mainMongooseDB;
				}

				app.setup(webapp,io,express,serverApp,app.configdata['folderpaths'],mongooseDB);
		},

	buildAppPaths: function(appname,serverApp,configattr) {
		if(typeof configattr['apps']['appsconf'][appname] === "undefined")       return null;
    if(typeof configattr['apps']['appsconf'][appname]['paths'] === "undefined")       return null;
		var appconf = configattr['apps']['appsconf'][appname];

		if(typeof appconf['paths']['baseconf'] === "undefined") {
			console.log("base conf (",appconf['paths']['baseconf'],") not found for:",appname);
			process.exit(1);
		}

		var appbasepath = this.corepath + "/fullapps/";
		if(typeof appconf['private'] !== "undefined" && appconf['private'] == true) {
			appbasepath += "/privateapps/";
    }
    else {
			appbasepath += "/publicapps/";
    }
		appbasepath += appname+"/";


		var branchconf = require(appbasepath + appconf['paths']['baseconf']);
		if(typeof branchconf['paths'][serverApp.launchMode] === "undefined") {
			console.log("conf mode not found:",serverApp.launchMode);
			process.exit(1);
		}


		var appsourcepath = appbasepath + branchconf['paths'][serverApp.launchMode]['sourcepath']+"/";
    var appcorefilepath = appsourcepath + appconf['paths']['core'];
		var appconfigpath = appbasepath + '/config/' + serverApp.launchMode +'/';


		var returnobj = {paths:{},configs:{}};
		returnobj['configs']['branchconf'] = branchconf;
		returnobj['configs']['appconf'] = appconf;
		returnobj['paths']['appbasepath'] = appbasepath;
		returnobj['paths']['appsourcepath'] = appsourcepath;
		returnobj['paths']['appconfigpath'] = appconfigpath;
		returnobj['paths']['appcorefilepath'] = appcorefilepath;
		return returnobj;
	},
	loadAppConfigs: function(appname,subapp,serverApp,app_loadobj,configattr) {
		var folderpaths = {};
		var filepaths = {};
		folderpaths['appbasepath'] = app_loadobj['paths']['appbasepath'];
		folderpaths['appsourcepath'] = app_loadobj['paths']['appsourcepath'];
		folderpaths['appconfigpath'] = app_loadobj['paths']['appconfigpath'];

		filepaths['appcorefile'] = app_loadobj['paths']['appcorefilepath'];

		if(typeof app_loadobj['configs']['appconf']['paths']['static'] !== "undefined") {
				var appstaticpath = folderpaths['appsourcepath'] + app_loadobj['configs']['appconf']['paths']['static'];
				folderpaths['appstaticpath'] = appstaticpath;
		}

		filepaths['appdataconffile'] = folderpaths['appconfigpath'] +	app_loadobj['configs']['appconf']['paths']['appdataconf'];
		if( !fs.existsSync(filepaths['appdataconffile']) ) {
		    console.log("conf file not found:",filepaths['appdataconffile']);
		    process.exit(1);
		}

		var appdataconf = require(filepaths['appdataconffile']);
		app_loadobj['configs']['appdataconf'] = appdataconf;
		if(typeof appdataconf['paths']['dbconf'] !== "undefined") {
				var dbconffile = folderpaths['appconfigpath'] + '/' + appdataconf['paths']['dbconf'];
				app_loadobj['configs']['appdbconf'] = require(dbconffile);
		}



		subapp.addConfigData('folderpaths',folderpaths);
		subapp.addConfigData('filepaths',filepaths);
		for(var cname in app_loadobj['configs']) {
				subapp.addConfigData(cname,app_loadobj['configs'][cname]);
		}
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


	serveAppView: function(res,appname) {
			if(typeof this.registeredapps[appname] === "undefined")
			{res.redirect('/404'); return;}
			if(typeof this.registeredapps[appname].instance === "undefined")
			{res.redirect('/404'); return;}

			var appdataconf = this.registeredapps[appname].instance.configdata.appdataconf;
	    if(typeof appdataconf === "undefined") {
	      res.redirect('/404');
	      return;
	    }
	    if(typeof appdataconf['paths'] === "undefined") {
	      res.redirect('/404');
	      return;
	    }


			var sourcepath = this.registeredapps[appname].instance.configdata['folderpaths']['appsourcepath'];
	    var appviewpath = sourcepath + appdataconf['paths']['view'];

	    res.sendFile(appviewpath);
  }


};
