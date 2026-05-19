const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');

// GET /feed - Fetch all coaching feeds
router.get('/', feedController.getFeeds);

// POST /feed - Create a new coaching feed
router.post('/', feedController.createFeed);

// POST /feed/:id/like - Like a coaching feed (real-time increment)
router.post('/:id/like', feedController.likeFeed);

module.exports = router;
