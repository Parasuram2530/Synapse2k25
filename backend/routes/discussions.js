const express = require('express');
const {
  createDiscussion,
  getDiscussionsByCourse,
  addReply,
  updateDiscussion
} = require('../controllers/discussionController');

// Middleware to verify JWT token
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Discussion routes
router.post('/', createDiscussion);
router.get('/course/:courseId', getDiscussionsByCourse);
router.post('/:id/reply', addReply);
router.put('/:id', updateDiscussion);

module.exports = router;