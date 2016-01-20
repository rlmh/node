var express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server),
  users = {};

server.listen(3000);

app.get('/', function(req, res) {
  res.sendFile( __dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {
  socket.on('send message', function(data, callback) {
    var msg = data.trim();
    if(msg.substr(0,3) == '/w ') {
      msg = msg.substr(3);
      var index = msg.indexOf(' ');
      if(index != -1) {
        user = msg.substr(0, index);
        msg = msg.substr(index+1);
        if(user in users) {
          users[user].emit('wisperer', {message: msg, user: socket.nickname});
        } else {
          callback('Error, user does not exist');
        }
      } else {
        callback('Error please enter a message');
      }
    } else {
      io.sockets.emit('new message', {user: socket.nickname, message: data});
    }
    // socket.broadcast.emit() //everyone except sender
  });

  socket.on('new user', function(data, callback) {
    if(data in users) {
      callback(false);
    } else {
      callback(true);
      socket.nickname = data;
      users[socket.nickname] = socket;
      updateNicknames();
    }
  });

  function updateNicknames() {
    io.sockets.emit('usernames', Object.keys(users));
  }

  socket.on('disconnect', function(data) {
    if(!socket.nickname) {
      return;
    }
    delete users[socket.nickname];
    updateNicknames();
  });
});
