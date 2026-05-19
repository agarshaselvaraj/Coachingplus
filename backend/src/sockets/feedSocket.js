let io = null;

function initSocket(server) {
  const { Server } = require('socket.io');
  
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Production level configurations for stability and reconnection handling
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected! ID: ${socket.id}`);
    
    // Send a welcome message or system check to verify socket is working
    socket.emit('system:info', {
      connected: true,
      message: 'Successfully connected to CoachingPulse Realtime Server!',
      socketId: socket.id
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket client disconnected. ID: ${socket.id}, Reason: ${reason}`);
    });
  });

  console.log('Socket.IO Server successfully initialized.');
  return io;
}

// Broadcasts a brand new coaching feed to all clients
function broadcastFeed(feed) {
  if (!io) {
    console.warn('Socket.IO is not initialized! Cannot broadcast new feed.');
    return;
  }
  
  console.log(`Broadcasting new feed in real-time: "${feed.title}" by ${feed.coach_name}`);
  // Use io.emit to push to ALL connected users
  io.emit('feed:new', feed);
}

// Broadcasts real-time updates (like likes count changing)
function broadcastFeedUpdate(update) {
  if (!io) {
    console.warn('Socket.IO is not initialized! Cannot broadcast update.');
    return;
  }
  
  console.log(`Broadcasting feed update: Feed ID ${update.id}`);
  io.emit('feed:updated', update);
}

module.exports = {
  initSocket,
  broadcastFeed,
  broadcastFeedUpdate,
  getIo: () => io
};
