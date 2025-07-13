const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authmiddleware');

const {
  sendMessage,
  getMessages,
  getCustomersChattedWith,
} = require('../controllers/messageController');

// 👥 Get customers the homecook has chatted with
router.get('/customers', protect, getCustomersChattedWith);

// 💬 Get all messages between the logged-in user and another user
router.get('/:otherUserId', protect, getMessages);

// 📩 Send a message
router.post('/', protect, sendMessage);

module.exports = router;
