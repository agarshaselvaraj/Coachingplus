const { createClient } = require('redis');
require('dotenv').config();

let redisClient = null;
let isRedisConnected = false;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        // Limit reconnect attempts to keep logs clean and avoid resource leaks
        if (retries > 10) {
          console.warn('Redis reconnection limit reached. Disabling Redis caching.');
          isRedisConnected = false;
          return false; // stop retrying
        }
        console.log(`Redis reconnecting... Attempt #${retries}`);
        return Math.min(retries * 500, 3000); // Backoff strategy
      }
    }
  });

  redisClient.on('connect', () => {
    console.log('Connecting to Redis...');
  });

  redisClient.on('ready', () => {
    isRedisConnected = true;
    console.log('Redis client connected and ready to use.');
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
    isRedisConnected = false;
  });

  redisClient.on('end', () => {
    console.log('Redis connection ended.');
    isRedisConnected = false;
  });

  // Connect asynchronously
  redisClient.connect().catch((err) => {
    console.error('Failed to initiate Redis connection:', err.message);
    isRedisConnected = false;
  });
} else {
  console.log('REDIS_URL is not set. Caching is disabled.');
}

// Graceful Cache Wrapper Functions
async function getCache(key) {
  if (!isRedisConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading cache for key "${key}":`, error);
    return null;
  }
}

async function setCache(key, value, ttlSeconds = 300) {
  if (!isRedisConnected || !redisClient) return false;
  try {
    const dataString = JSON.stringify(value);
    await redisClient.set(key, dataString, {
      EX: ttlSeconds
    });
    return true;
  } catch (error) {
    console.error(`Error writing cache for key "${key}":`, error);
    return false;
  }
}

async function deleteCache(key) {
  if (!isRedisConnected || !redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Error deleting cache for key "${key}":`, error);
    return false;
  }
}

module.exports = {
  redisClient,
  isRedisConnected: () => isRedisConnected,
  getCache,
  setCache,
  deleteCache,
};
