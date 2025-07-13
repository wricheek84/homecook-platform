const express = require('express');
const router = express.Router();


const {
  createDish,
  getAllDishes,
  updateDish,
  getDishById,
  deleteDish
} = require('../controllers/dishcontroller');

const protect = require('../middlewares/authmiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');
const upload = require('../middlewares/multer'); // ⬅️ Add multer middleware

// 🍳 Only homecooks can create/update/delete dishes
router.post(
  '/',
  protect,
  authorizeRoles('homecook'),
  upload.single('image'), // ⬅️ This line enables image upload (field name: "image")
  createDish
);

router.put('/:id', protect, authorizeRoles('homecook'), updateDish);
router.delete('/:id', protect, authorizeRoles('homecook'), deleteDish);

// 🌍 Public routes
router.get('/', protect, getAllDishes);
router.get('/:id', getDishById);

module.exports = router;
