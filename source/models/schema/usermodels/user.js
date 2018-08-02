// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = new mongoose.Schema({

    email     : {
      type: String,
      unique: true,
      required: true,
      trim: true
    },
    password     : {
      type: String,
      required: true,
      trim: true
    },
    username     : {
      type: String,
      unique: true,
//      required: true,
      trim: true
    },
    displayname     : {
      type: String,
      trim: true
    },
    displayname     : {
      type: String,
      trim: true
    },
    verified        : {
      type: Boolean,
      required: true,
      default: false
    },
    verifyHash      : {
      type: String,
      required: true
    },

    authid     : {
      type: String,
//      unique: true,
//      required: true,
      trim: true
    },
    securid     : {
      type: String,
//      unique: true,
//      required: true,
      trim: true
    },
    accexid     : {
      type: String,
//      unique: true,
//      required: true,
      trim: true
    }
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

userSchema.methods.generateSimpleHash = function(length) {
    if(typeof length === "undefined" || length == null)   length = 20;
    return Math.random().toString(36).replace(/[^a-z0-9]+/g, '').substr(0, length);
};
/*
userSchema.methods.generateID = function() {
};
/**/
//  http://codetheory.in/using-the-node-js-bcrypt-module-to-hash-and-safely-store-passwords/
// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
