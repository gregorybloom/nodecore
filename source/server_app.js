module.exports = function() {
    function ServerApplication() {
    }
    ServerApplication.prototype.init = function() {
        this.launchMode = null;

        this.webapp = null;
        this.express = null;
        this.io = null;

        this.basepath = null;
        this.serverpath = null;

        this.port = null;

        this.mongooseClass = null;
        this.mongooseDB = null;
        this.configdata = {};
        this.schema = {};
    };
    ServerApplication.prototype.setPort = function(port) {
      this.port = port;
    };
    ServerApplication.prototype.setMode = function(mode) {
      this.launchMode = mode;
    };
    ServerApplication.prototype.setPath = function(path) {
      this.serverpath = path;
      this.basepath = path.match("^(.*\/nodecore\/).*").pop();
    };
    ServerApplication.prototype.setModules = function(webapp,io,express) {
        this.webapp = webapp;
        this.io = io;
        this.express = express;
    };
    ServerApplication.prototype.setDB = function(mongooseClass,mongooseDB) {
        this.mongooseClass = mongooseClass;
        this.mainMongooseDB = mongooseDB;
    };
    ServerApplication.prototype.addConfigData = function(name,conf) {
        this.configdata[name] = conf;
    };
    ServerApplication.prototype.addSchema = function(name,schema) {
        this.schema[name] = schema;
    };


    ServerApplication.alloc = function() {
        var vc = new ServerApplication();
      	vc.init();
      	return vc;
    };

    return ServerApplication;
};
