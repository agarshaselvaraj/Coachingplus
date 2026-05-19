const db = require('../config/db');
const redis = require('../config/redis');
const { broadcastFeed, broadcastFeedUpdate } = require('../sockets/feedSocket');

// Cache key for all feeds
const CACHE_KEY = 'feed:all';

// GET /feed
async function getFeeds(req, res) {
  try {
    // 1. Try fetching from Redis Cache
    const cachedFeeds = await redis.getCache(CACHE_KEY);
    
    if (cachedFeeds) {
      // Send X-Cache: HIT header to indicate data was retrieved from Redis
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: cachedFeeds
      });
    }

    // 2. Cache miss -> query PostgreSQL
    console.log('Cache MISS. Fetching feeds from PostgreSQL...');
    const result = await db.query(
      'SELECT * FROM feeds ORDER BY created_at DESC'
    );
    const feeds = result.rows;

    // 3. Write data to Redis Cache (expires in 5 minutes / 300 seconds)
    await redis.setCache(CACHE_KEY, feeds, 300);

    // Send X-Cache: MISS header
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json({
      success: true,
      source: 'database',
      data: feeds
    });
  } catch (error) {
    console.error('Error fetching feeds:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch feeds',
      error: error.message
    });
  }
}

// POST /feed
async function createFeed(req, res) {
  const { title, content, coach_name, category } = req.body;

  // 1. Input Validation
  if (!title || !content || !coach_name || !category) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required: title, content, coach_name, category'
    });
  }

  try {
    // Generate a professional, unique initials-based avatar
    const nameParts = coach_name.trim().split(/\s+/);
    const initials = nameParts.map(part => part[0]).join('').substring(0, 2).toUpperCase();
    const seed = encodeURIComponent(initials || 'C');
    const coach_avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&fontSize=42&fontWeight=600`;

    // 2. Insert feed into database
    const insertQuery = `
      INSERT INTO feeds (title, content, coach_name, coach_avatar, category)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await db.query(insertQuery, [
      title,
      content,
      coach_name,
      coach_avatar,
      category
    ]);
    const newFeed = result.rows[0];

    // 3. Invalidate Redis Cache
    await redis.deleteCache(CACHE_KEY);
    console.log('Cache invalidated due to new feed creation.');

    // 4. Broadcast the new feed in real-time via Socket.IO
    broadcastFeed(newFeed);

    return res.status(201).json({
      success: true,
      message: 'Feed created successfully!',
      data: newFeed
    });
  } catch (error) {
    console.error('Error creating feed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create feed',
      error: error.message
    });
  }
}

// POST /feed/:id/like (Bonus Interaction!)
async function likeFeed(req, res) {
  const { id } = req.params;

  try {
    // 1. Increment likes count in PostgreSQL
    const updateQuery = `
      UPDATE feeds 
      SET likes_count = likes_count + 1 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await db.query(updateQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feed not found'
      });
    }

    const updatedFeed = result.rows[0];

    // 2. Invalidate Redis Cache
    await redis.deleteCache(CACHE_KEY);
    
    // 3. Broadcast the like update in real-time to all clients
    broadcastFeedUpdate({
      id: updatedFeed.id,
      likes_count: updatedFeed.likes_count
    });

    return res.status(200).json({
      success: true,
      data: updatedFeed
    });
  } catch (error) {
    console.error('Error liking feed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to like feed',
      error: error.message
    });
  }
}

module.exports = {
  getFeeds,
  createFeed,
  likeFeed,
};
