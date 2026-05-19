const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const { initDb, pool } = require('./config/db');
const redis = require('./config/redis');
const { initSocket } = require('./sockets/feedSocket');
const feedRoutes = require('./routes/feedRoutes');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5001;

// 1. Middleware Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// 2. Database & WebSocket Initialization
initDb().then(() => {
  console.log('PostgreSQL Database initialization complete.');
}).catch((err) => {
  console.error('PostgreSQL Database initialization failed:', err);
});

initSocket(server);

// 3. Health & Status Check Endpoint
app.get('/health', async (req, res) => {
  let dbStatus = 'healthy';
  let redisStatus = redis.isRedisConnected() ? 'healthy' : 'disconnected';
  
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    dbStatus = `unhealthy: ${err.message}`;
  }

  return res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      cache: redisStatus
    }
  });
});

// 4. API Routes Mounting
app.use('/feed', feedRoutes);

// 5. Start HTTP Server
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 CoachingPulse Server running on http://localhost:${PORT}`);
  console.log(`   Realtime WebSockets active on the same port.`);
  console.log(`====================================================`);
});

// 6. Graceful Shutdown Handlers
const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  // Close database pool
  try {
    await pool.end();
    console.log('PostgreSQL pool closed.');
  } catch (err) {
    console.error('Error closing PostgreSQL pool:', err);
  }

  // Close Redis connection
  if (redis.redisClient && redis.isRedisConnected()) {
    try {
      await redis.redisClient.disconnect();
      console.log('Redis connection closed.');
    } catch (err) {
      console.error('Error closing Redis client:', err);
    }
  }

  // Close HTTP Server
  server.close(() => {
    console.log('CoachingPulse HTTP and Socket server terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
