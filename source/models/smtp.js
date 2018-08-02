var nodemailer = require("nodemailer");

module.exports = {
    getSmtpInfo: function(loadpaths) {

      var smtpConf = require('../'+loadpaths['configpath']+'/mail.js');

      var smtpTransport = nodemailer.createTransport(
        {
          host:"smtp.gmail.com",
          port:465,
          secure: true, // true for 465, false for other ports
          auth: {
              user: smtpConf.servermail.server.username, // generated ethereal user
              pass: smtpConf.servermail.server.password // generated ethereal password
          }
        }
      );

      return {transport:smtpTransport,conf:smtpConf};
    },
    sendVerifyMail: function(loadpaths,email,opts) {
      var link="https://"+opts['host']+":"+opts['port']+"/verify?hash="+opts['hash'];
      var smtpobj = this.getSmtpInfo(loadpaths);

      var smtpTransport = smtpobj.transport;
      var mailOptions={
          to : email,
          subject : "Please confirm your Email account",
          html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
      };
      smtpTransport.sendMail(mailOptions, function(error, response){
         if(error)
         {
            console.log(error);
            return false;
         }
         else
         {
            console.log("Message sent: " + response.message);
            return true;
         }
       });
    }
};
