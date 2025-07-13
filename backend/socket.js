const { Server } = require('socket.io');

let io;

function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow requests from any frontend for now
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('📲 A user connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`✅ User ${userId} joined room`);
    });

    socket.on('send_message', (data) => {
      console.log('💬 Message:', data);
      io.to(data.receiverId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

module.exports = { setupSocket, getIo };