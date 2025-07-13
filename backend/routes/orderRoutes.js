const express = require('express');
const router = express.Router();

const {
  placeOrder,
  getCustomerOrders,
  getHomecookOrders,
  updateOrderStatus,
} = require('../controllers/orderController');

const authMiddleware = require('../middlewares/authmiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles'); // ✅ Added

// 🛒 Only customers can place orders
router.post('/', authMiddleware, authorizeRoles('customer'), placeOrder);

// 📦 Only customers can view their orders
router.get('/customer', authMiddleware, authorizeRoles('customer'), getCustomerOrders);


// 🍳 Only homecooks can view incoming orders
router.get('/incoming', authMiddleware, authorizeRoles('homecook'), getHomecookOrders);

// 🔄 Only homecooks can update order status
router.put('/:orderId/status', authMiddleware, authorizeRoles('homecook'), updateOrderStatus);

module.exports = router;
