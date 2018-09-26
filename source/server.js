// server.js
//    https://codeburst.io/javascript-unit-testing-using-mocha-and-chai-1d97d9f18e71
//    https://hackernoon.com/a-crash-course-on-testing-with-node-js-6c7428d3da02
//    https://blog.risingstack.com/node-hero-node-js-unit-testing-tutorial/

//    https://stackoverflow.com/questions/39092822/how-to-do-confirm-email-address-with-express-node
//    https://medium.freecodecamp.org/securing-node-js-restful-apis-with-json-web-tokens-9f811a92bb52


//    https://www.toptal.com/nodejs/top-10-common-nodejs-developer-mistakes
//    https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/
//    https://technology.amis.nl/2017/05/18/sequential-asynchronous-calls-in-node-js-using-callbacks-async-and-es6-promises/
//    https://medium.com/dev-bits/writing-neat-asynchronous-node-js-code-with-promises-32ed3a4fd098


var fs = require('fs');
var https = require('https');
var path = require('path');

var launchMode = process.env.LAUNCH || "development";

var confpaths = require('./config/confpaths.js');
if(typeof confpaths['paths'][launchMode] === "undefined") {
  console.log("conf mode not found:",launchMode);
  process.exit(1);
}
var loadpaths = {};
loadpaths['sourcepath'] = confpaths['paths'][launchMode]['sourcepath'];
loadpaths['configpath'] = confpaths['paths'][launchMode]['configpath'];
if( !fs.existsSync(loadpaths['sourcepath']+'/'+loadpaths['configpath']+'/database.js') ) {
    console.log("conf file not found:",loadpaths['sourcepath']+'/'+loadpaths['configpath']+'/database.js');
    process.exit(1);
}
// initialize ===============================================================

var express  = require('express');
var webapp   = express();
webapp.set('views', path.join(__dirname, '/views'));

var SSLpaths = require('./'+loadpaths['configpath']+'/ssl.js');
var SSLoptions = {
  key: fs.readFileSync(SSLpaths['paths'].key),
  cert: fs.readFileSync(SSLpaths['paths'].cert)
};


var httpsServer = https.createServer(SSLoptions, webapp);
var io       = require('socket.io')(httpsServer);
var passport = require('passport');

var servconf = require('./'+loadpaths['configpath']+'/serverconf.js');

//var port     = process.env.PORT || 3314;
var port = servconf['authserv'].port;

var mongoose = require('mongoose');
var passportSocketIo = require("passport.socketio");
var connectflash    = require('connect-flash');
var connectmongo    = require('connect-mongo');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var expSession      = require('express-session');


var configDB = require('./'+loadpaths['configpath']+'/database.js');
var configSess = require('./'+loadpaths['configpath']+'/session.js');

webapp.use(express.static(path.join(__dirname, 'public')));
webapp.use(express.static(__dirname + '/node_modules'));
//var UserSchema = mongoose.model('User').schema;
//console.log('SS',UserSchema);

// configuration ===============================================================
configSess.secret = configDB['userdb'].secret;

var dbUrl = 'mongodb://';
dbUrl += configDB['userdb'].dbstore.username + ':' + configDB['userdb'].dbstore.password + '@';
dbUrl += configDB['userdb'].dbstore.hostaddr + ':' + configDB['userdb'].dbstore.port + '/' + configDB['userdb'].dbstore.dbname;
configDB['userdb'].dbstore.url = dbUrl;

console.log('dbconnect:  '+configDB['userdb'].dbstore.username+':******@'+configDB['userdb'].dbstore.hostaddr + ':' + configDB['userdb'].dbstore.port + '/' + configDB['userdb'].dbstore.dbname);


//  Drop all client sessions on server restart!
var MongoClient = require('mongodb').MongoClient;
MongoClient.connect(dbUrl, function(err, db) {
  if (err) throw err;
  var dbo = db.db( configDB['userdb'].dbstore.dbname );
  dbo.collection("sessions").drop(function(err, delOK) {
    if (err) throw err;
    if (delOK) console.log("Collection deleted");
    db.close();
  });
});

//  Configure client sessions in DB
var mongoStore = connectmongo(expSession);
configSess.store = new mongoStore(configDB['userdb'].dbstore);
configSess.cookieParser = cookieParser;


mongoose.connect(dbUrl);

//  ===============================================================
webapp.use(connectflash()); // use connect-flash for flash messages stored in session
webapp.set('view engine', 'ejs'); // set up ejs for templating

webapp.use(bodyParser.urlencoded({extended: false}));
webapp.use(cookieParser()); // read cookies (needed for auth)
webapp.use(expSession(configSess));

webapp.use(passport.initialize());
webapp.use(passport.session()); // persistent login sessions

require('./config/passport')(passport, {port:port,loadpaths:loadpaths} );

var dbsocket = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
dbsocket.on('error', console.error.bind(console, 'MongoDB connection error:'));
//  ===============================================================
var authClients = {};
var clientsByRoom = {};



var FUNCTIONSCLASS=require('./models/functions.js'); // load our routes and pass in our app and fully configured passport
io.use(passportSocketIo.authorize({ //configure socket.io
//   cookieParser: cookieParser,
   secret:      configSess.secret,    // make sure it's the same than the one you gave to express
   store:       configSess.store,
   key:         configSess.name,
   success:     FUNCTIONSCLASS.onAuthorizeSuccess,  // *optional* callback on success
   fail:        FUNCTIONSCLASS.onAuthorizeFail,     // *optional* callback on fail/error
}));


var configApps = require('./'+loadpaths['configpath']+'/apps.js');

var sessionmanager = require('./models/sessionmanager.js');
var appcontroller = require('./models/appcontroller.js');

require('./models/routes.js')(webapp, __dirname, {mode:launchMode,hostname:"manaofmana.com"}, {apps:configApps}, sessionmanager); // load our routes and pass in our app and fully configured passport
require('./models/formactions.js')(webapp, passport, {'loadpaths':loadpaths}, sessionmanager); // load our routes and pass in our app and fully configured passport




//var roomkeeper = require('./app/roomkeeper.js');
sessionmanager.appcontroller = appcontroller;
//setInterval(  sessionmanager.checkClients.bind(sessionmanager), (1000*60*5)  );

require('./models/ioactions.js')(webapp, express, io, __dirname, {}, {apps:configApps}, sessionmanager, appcontroller); // load our routes and pass in our app and fully configured passport


httpsServer.listen(port, function(){
  console.log('listening on *:'+port);
});
