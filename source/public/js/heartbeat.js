$(document).ready(function(){
  if(typeof io === "undefined" || io == null)     return;
  var socket = io();
  var appspace = 'website-';
  socket.on(appspace+'heartbeat', function(msg){
    socket.emit(appspace+'heartbeatreturn', {} );
  });
});
