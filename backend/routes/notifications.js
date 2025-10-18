const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationCount,
  deleteNotification
} = require('../controllers/notificationController');

// Middleware to verify JWT token
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Notification routes
router.get('/', getNotifications);
router.get('/count', getNotificationCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;