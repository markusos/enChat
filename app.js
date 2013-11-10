
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var fs = require('fs');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var lastSender;
var users = new Object();
var usercount = 0;

// Read images for user and server
var bitmap = fs.readFileSync("public/images/icons/user.png");
var userImage = Buffer(bitmap).toString('base64');
bitmap = fs.readFileSync("public/images/icons/info.png");
var serverUserImage = Buffer(bitmap).toString('base64');

io.sockets.on('connection', function (socket) {

  // Handle connect events
  socket.on('connect', function (data) {

    // Set up User data
    usercount += 1;
    user = new Object();
    user.username = data.username;
    user.room = data.room;
    user.uid = usercount;
    user.image = userImage;
    users[socket.id] = user;
    socket.emit('connect', user);

    // Join room
    socket.join(user.room);
    sendServerMessage('User: \'' + user.username + '\' connected to room: \'' + user.room + '\'');

    console.log('Connected user: ' + user.username + ' to room: ' + user.room);
    console.log(users);
  });

  // Handle message events
  socket.on('message', function (message) {

    var data = new Object()
    data.message = message
    data.sender = users[socket.id];
    data.timestamp = (new Date()).getTime();
    
    sendMessage(data);
    console.log(data);
  });

  // Handle disconnect events
  socket.on('disconnect', function () {
    try {
      sendServerMessage('User ' + users[socket.id].username + ' Disconnected')
      console.log('Disconnected user: \'' + users[socket.id].username + '\'');  
      delete users[socket.id];
      console.log(users);   
    }
    catch (err) {
      console.log('Uninitialized user disconnected: ' + err);   
    }   
  });

  function sendMessage(data) {
    socket.broadcast.in(users[socket.id].room).emit('message', data);
    socket.emit('message', data);
    console.log('Sending data: ' + data.toString() + ' to room: ' + users[socket.id].room);  
  }

  function sendServerMessage(message) {
    // Create Server message data object
    data = new Object();
    data.sender = {'username':'Server Message', 'room':users[socket.id].room, 'uid':0, 'image':serverUserImage};
    data.timestamp = (new Date()).getTime();
    data.message = message;
    sendMessage(data);  
  }
});
