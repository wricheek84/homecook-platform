const express = require('express');
const router = express.Router();

const {
  createCheckoutSession,
  handleStripeWebhook,
  generateReceiptPDF, // ✅ NEW: PDF receipt generator
} = require('../controllers/paymentController');

const auth = require('../middlewares/authmiddleware');

// 🔐 For authenticated users starting Stripe session
router.post('/create-checkout-session', auth, createCheckoutSession);

// 🔓 For Stripe webhook to update payment status
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// 📄 For authenticated customers to download a specific receipt
router.get('/receipt/:orderId', auth, generateReceiptPDF); // ✅ NEW route

module.exports = router;
