// server.js
//    https://codeburst.io/javascript-unit-testing-using-mocha-and-chai-1d97d9f18e71
//    https://hackernoon.com/a-crash-course-on-testing-with-node-js-6c7428d3da02
//    https://blog.risingstack.com/node-hero-node-js-unit-testing-tutorial/

var fs = require('fs');
var https = require('https');
var path = require('path');

var SSLpaths = require('./config/ssl.js');
var SSLoptions = {
  key: fs.readFileSync(SSLpaths['paths'].key),
  cert: fs.readFileSync(SSLpaths['paths'].cert)
};

var launchMode = process.env.LAUNCH || "development";

// initialize ===============================================================

var express  = require('express');
var app      = express();
app.set('views', path.join(__dirname, '/views'));


var httpsServer = https.createServer(SSLoptions, app);
var io       = require('socket.io')(httpsServer);
var passport = require('passport');

var port     = process.env.PORT || 3314;
var mongoose = require('mongoose');
var passportSocketIo = require("passport.socketio");
var connectflash    = require('connect-flash');
var connectmongo    = require('connect-mongo');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var expSession      = require('express-session');


var configDB = require('./config/database.js');
var configSess = require('./config/session.js');


app.use(express.static(__dirname + '/node_modules'));
//var UserSchema = mongoose.model('User').schema;
//console.log('SS',UserSchema);

// configuration ===============================================================
configSess.secret = configDB.secret;

var dbUrl = 'mongodb://';
dbUrl += configDB.db.username + ':' + configDB.db.password + '@';
dbUrl += configDB.db.hostaddr + ':' + configDB.db.port + '/' + configDB.db.dbname;
configDB.db.url = dbUrl;

var mongoStore = connectmongo(expSession);
configSess.store = new mongoStore(configDB.db);
configSess.cookieParser = cookieParser;


mongoose.connect(dbUrl);
//  ===============================================================
app.use(connectflash()); // use connect-flash for flash messages stored in session
app.set('view engine', 'ejs'); // set up ejs for templating

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser()); // read cookies (needed for auth)
app.use(expSession(configSess));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

require('./config/passport')(passport);

var dbsocket = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
dbsocket.on('error', console.error.bind(console, 'MongoDB connection error:'));
//  ===============================================================
var authClients = {};
var clientsByRoom = {};

var sessionmanager = require('./models/sessionmanager.js');
var appcontroller = require('./models/appcontroller.js');


require('./models/routes.js')(app, __dirname, {}, sessionmanager); // load our routes and pass in our app and fully configured passport
require('./models/formactions.js')(app, passport, {}, sessionmanager); // load our routes and pass in our app and fully configured passport

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
setInterval(  sessionmanager.checkClients.bind(sessionmanager), (1000*60*5)  );

require('./models/ioactions.js')(app, io, __dirname, {}, sessionmanager, appcontroller); // load our routes and pass in our app and fully configured passport


httpsServer.listen(port, function(){
  console.log('listening on *:'+port);
});
