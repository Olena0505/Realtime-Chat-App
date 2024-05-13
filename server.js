const { table } = require('console');
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer();
const io = socketIo(server, {
  cors: {
    origin: '*',
  }
});

const PORT = 3000;
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
    if (data.targetRoomId === 0) {
      socket.broadcast.emit('chat-message', { message: data.messageInfo, targetRoomId: data.targetRoomId });
    } else {
      io.to(data.targetRoomId).emit('chat-message', { message: data.messageInfo, targetRoomId: data.targetRoomId });
    }
  });

  socket.on('get-all-members', () => {
    socket.emit('all-members', users);
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('user-disconnected', socket.id);
    delete users[socket.id];
  });
});