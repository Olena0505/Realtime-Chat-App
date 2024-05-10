const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(
  server, {
  cors: {
    origin: '*',
  }
})

const PORT = 4444;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const users = {};
io.on('connection', socket => {

  socket.on('new-user', name => {
    users[socket.id] = name;
    socket.emit('user-connected', {   
      id: socket.id,
      usersList: users
    });
    socket.broadcast.emit('new-chat', {id: socket.id, name: users[socket.id]});
  });

  socket.on('send-chat-message', data => {
    socket.broadcast.emit('chat-message', { message: data.messageInfo, targetRoomId: data.targetRoomId });
  });

  socket.on('get-all-members', () => {
    socket.emit('all-members', users);
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('user-disconnected', socket.id);
    delete users[socket.id];
  });

});