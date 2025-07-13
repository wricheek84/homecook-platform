const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authmiddleware');

const {
  registerUser,
  loginUser,
  getAllUsers,
  getAllHomecooks,
} = require('../controllers/userController');

// 📝 Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// 🔐 Authenticated Routes
router.get('/profile', protect, (req, res) => {
  res.json({
    message: 'Protected route accessed!',
    user: req.user
  });
});

// ✅ Authenticated route to get all users (for debug / customer listing)
router.get('/', protect, getAllUsers);

// 🍳 Get all homecooks (for chat/discover)
router.get('/homecooks', protect, getAllHomecooks);

module.exports = router;
