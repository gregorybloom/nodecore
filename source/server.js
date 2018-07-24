// server.js
//    https://medium.com/of-all-things-tech-progress/starting-with-authentication-a-tutorial-with-node-js-and-mongodb-25d524ca0359
/*
var myArgs = process.argv.slice(2);
var basepath = null;
if (myArgs.len > 0) {
  basepath=myArgs[0]
}/**/

//var http = require('http');
//const tls = require('tls');

var fs = require('fs');
var https = require('https');
var path = require('path');
var SSLoptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/manaofmana.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/manaofmana.com/fullchain.pem'),
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

//    https://codeburst.io/hitchhikers-guide-to-back-end-development-with-examples-3f97c70e0073?gi=66d9859b0e75
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

/*
var sessionmanager = require('./models/sessionmanager.js');
var appcontroller = require('./models/appcontroller.js');
var roomkeeper = require('./models/roomkeeper.js');
sessionmanager.appcontroller = appcontroller;
//  setInterval(  sessionmanager.checkClients.bind(sessionmanager), (1000*60*5)  );
//  require('./app/routes.js')(app, passport, configAttr, sessionmanager); // load our routes and pass in our app and fully configured passport
/**/
//  ===============================================================
// process the login form

/*
    if(req.body.change_displayname=="") {
        var displayname = req.body.displayname;
        if(typeof displayname === "undefined")  displayname = req.user.username;
        if(displayname.match(/^\s*$/g))         displayname = req.user.username;

        req.user.displayname = displayname;

        User.update( {'email':req.user.email}, {'displayname':displayname}, function (err, numAffected) {
            res.redirect('/profile');
        });
    }
    else if(req.body.change_deleteaccount0=="") {
        req.flash('profileMessage', 'Are you sure you want to delete your profile?');
        res.render('profile.ejs', {
            message : req.flash('profileMessage'),
            delstep : 1,
            query : req.query,
            user : req.user // get the user out of session and pass to template
        });
    }
    else if(req.body.change_deleteaccount1=="") {
        req.user.remove( function(err) {
            if (err)        throw err;
            console.log('User successfully deleted');
            req.logout();
            res.redirect('/');
        });
    }
    else if(req.body.change_nothing=="") {
        res.redirect('/profile');
    }
    else {
        req.flash('profileMessage', 'Profile edit error');
        res.redirect('/profile');
    }
});
/**/
var sessionmanager = require('./models/sessionmanager.js');
var appcontroller = require('./models/appcontroller.js');


require('./models/routes.js')(app, __dirname, {}, sessionmanager); // load our routes and pass in our app and fully configured passport
require('./models/formactions.js')(app, passport, {}, sessionmanager); // load our routes and pass in our app and fully configured passport

var FUNCTIONSCLASS=require('./models/functions.js'); // load our routes and pass in our app and fully configured passport


//  io.use(passportSocketIo.authorize({ //configure socket.io
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
//  setInterval(  sessionmanager.checkClients.bind(sessionmanager), (1000*60*5)  );
setInterval(  sessionmanager.checkClients.bind(sessionmanager), (1000*5)  );

require('./models/ioactions.js')(app, io, __dirname, {}, sessionmanager, appcontroller); // load our routes and pass in our app and fully configured passport


httpsServer.listen(port, function(){
  console.log('listening on *:'+port);
});



/*
// configuration ===============================================================
/*
// gzip/deflate outgoing responses
//var compression = require('compression');
//app.use(compression());
/*
// store session state in browser cookie
var cookieSession = require('cookie-session');
app.use(cookieSession({
    keys: ['secret1', 'secret2']
}));

// parse urlencoded request bodies into req.body
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

// respond to all requests
app.use(function(req, res){
  res.end('Hello from Connect!\n');
});

//create node.js http server and listen on port
http.createServer(app).listen(3314);

/**/
console.log('Made it here');



/*
if (req.body.email &&
  req.body.username &&
  req.body.password &&
  req.body.passwordConf) {
  var userData = {
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    passwordConf: req.body.passwordConf,
  }
  //use schema.create to insert data into the db
  User.create(userData, function (err, user) {
    if (err) {
      return next(err)
    } else {
      return res.redirect('/profile');
    }
  });
}   /**/

/*

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport



/*
var session = require('express-session'); //You should already have this line in your app
var passportSocketIo = require("passport.socketio");
var io = require("socket.io")(server);
var RedisStore = require('connect-redis')(session);

var sessionStore = new RedisStore({ // Create a session Store
   host: 'manaofmana.com',
   port: 3314,
});

app.use(session({
  store: sessionStore,  //tell express to store session info in the Redis store
  secret: 'mysecret'
}));

io.use(passportSocketIo.authorize({ //configure socket.io
   cookieParser: cookieParser,
   secret:      'mysecret',    // make sure it's the same than the one you gave to express
   store:       sessionStore,
   success:     onAuthorizeSuccess,  // *optional* callback on success
   fail:        onAuthorizeFail,     // *optional* callback on fail/error
}));



function onAuthorizeSuccess(data, accept){
  console.log('successful connection to socket.io');
  accept(); //Let the user through
}

function onAuthorizeFail(data, message, error, accept){
  if(error) accept(new Error(message));
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}

io.sockets.on('connection', function(socket) {
  console.log(socket.request.user);
});

/**/
