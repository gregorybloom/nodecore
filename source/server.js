// server.js
//    https://codeburst.io/javascript-unit-testing-using-mocha-and-chai-1d97d9f18e71
//    https://hackernoon.com/a-crash-course-on-testing-with-node-js-6c7428d3da02
//    https://blog.risingstack.com/node-hero-node-js-unit-testing-tutorial/

//    https://stackoverflow.com/questions/39092822/how-to-do-confirm-email-address-with-express-node

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
var app      = express();
app.set('views', path.join(__dirname, '/views'));

var SSLpaths = require('./'+loadpaths['configpath']+'/ssl.js');
var SSLoptions = {
  key: fs.readFileSync(SSLpaths['paths'].key),
  cert: fs.readFileSync(SSLpaths['paths'].cert)
};


var httpsServer = https.createServer(SSLoptions, app);
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

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/node_modules'));
//var UserSchema = mongoose.model('User').schema;
//console.log('SS',UserSchema);

// configuration ===============================================================
configSess.secret = configDB['userdb'].secret;

var dbUrl = 'mongodb://';
dbUrl += configDB['userdb'].db.username + ':' + configDB['userdb'].db.password + '@';
dbUrl += configDB['userdb'].db.hostaddr + ':' + configDB['userdb'].db.port + '/' + configDB['userdb'].db.dbname;
configDB['userdb'].db.url = dbUrl;

console.log('dbconnect:  '+configDB['userdb'].db.username+':******@'+configDB['userdb'].db.hostaddr + ':' + configDB['userdb'].db.port + '/' + configDB['userdb'].db.dbname);

var mongoStore = connectmongo(expSession);
configSess.store = new mongoStore(configDB['userdb'].db);
configSess.cookieParser = cookieParser;


var confobj = {port:port,loadpaths:loadpaths};


mongoose.connect(dbUrl);
//  ===============================================================
app.use(connectflash()); // use connect-flash for flash messages stored in session
app.set('view engine', 'ejs'); // set up ejs for templating

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser()); // read cookies (needed for auth)
app.use(expSession(configSess));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

require('./config/passport')(passport,confobj);

var dbsocket = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
dbsocket.on('error', console.error.bind(console, 'MongoDB connection error:'));
//  ===============================================================
var authClients = {};
var clientsByRoom = {};

var sessionmanager = require('./models/sessionmanager.js');
var appcontroller = require('./models/appcontroller.js');


require('./models/routes.js')(app, __dirname, {mode:launchMode,hostname:"manaofmana.com"}, sessionmanager); // load our routes and pass in our app and fully configured passport
require('./models/formactions.js')(app, passport, {'loadpaths':loadpaths}, sessionmanager); // load our routes and pass in our app and fully configured passport

var FUNCTIONSCLASS=require('./models/functions.js'); // load our routes and pass in our app and fully configured passport


io.use(passportSocketIo.authorize({ //configure socket.io
//   cookieParser: cookieParser,
   secret:      configSess.secret,    // make sure it's the same than the one you gave to express
   store:       configSess.store,
   key:         configSess.name,
   success:     FUNCTIONSCLASS.onAuthorizeSuccess,  // *optional* callback on success
   fail:        FUNCTIONSCLASS.onAuthorizeFail,     // *optional* callback on fail/error
}));

//var roomkeeper = require('./app/roomkeeper.js');
sessionmanager.appcontroller = appcontroller;
//setInterval(  sessionmanager.checkClients.bind(sessionmanager), (1000*60*5)  );

require('./models/ioactions.js')(app, io, __dirname, {}, sessionmanager, appcontroller); // load our routes and pass in our app and fully configured passport


httpsServer.listen(port, function(){
  console.log('listening on *:'+port);
});
