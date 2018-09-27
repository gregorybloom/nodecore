// app/models/user.js
// load the things we need
/*
var mongoose = require('mongoose');
/**/
module.exports = function(mongooseDB){

    // define the schema for our user model
    var postLogSchema = new mongooseDB.Schema({
        IPaddress     : {
          type: String,
          trim: true
        },
        socketID     : {
          type: String,
          trim: true
        },
        email     : {
          type: String,
          trim: true
        },
        userID     : {
          type: String,
          trim: true
        },
        username     : {
          type: String,
          trim: true
        },
        chatdisplayname     : {
          type: String,
          required: true,
          trim: true
        },
        time     : {
          type: Date,
          required: true,
          trim: true
        },
        verified        : {
          type: Boolean,
          required: true,
          default: false
        },
        post      : {
          type: String,
          required: true
        }
    });

    //  http://codetheory.in/using-the-node-js-bcrypt-module-to-hash-and-safely-store-passwords/
    // create the model for users and expose it to our app
    return mongooseDB.model('PostLog', postLogSchema);

};
