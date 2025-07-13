// routes/wishlistRoutes.js
const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');

// ✅ Test Route - Just to confirm route is connected
router.get('/test', (req, res) => {
  console.log('✅ /api/wishlist/test was hit');
  res.send('Wishlist route working!');
});

// ✅ Add a dish to wishlist
router.post('/', (req, res) => {
  console.log('➡️ POST /api/wishlist hit with body:', req.body);
  wishlistController.addToWishlist(req, res);
});

// ✅ Remove a dish from wishlist
router.delete('/', (req, res) => {
  console.log('🗑️ DELETE /api/wishlist hit with body:', req.body);
  wishlistController.removeFromWishlist(req, res);
});

// ✅ Get wishlist for a customer
router.get('/:customerId', (req, res) => {
  console.log('📥 GET /api/wishlist/:customerId hit with param:', req.params.customerId);
  wishlistController.getWishlistByCustomer(req, res);
});

module.exports = router;
