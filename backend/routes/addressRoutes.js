const express = require('express');
const router = express.Router();
const { saveAddress, getAddress } = require('../controllers/addressController');
const auth = require('../middlewares/authmiddleware');

// 🔐 Create or update address (both use same controller)
router.post('/', auth, saveAddress);  // For creating (first-time)
router.put('/', auth, saveAddress);   // For updating (if address exists)

// 🔐 Get current customer address
router.get('/', auth, getAddress);

module.exports = router;
