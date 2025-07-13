// controllers/wishlistController.js
const db = require('../config/db');

// Add dish to wishlist
exports.addToWishlist = (req, res) => {
  const { customer_id, dish_id } = req.body;

  if (!customer_id || !dish_id) {
    return res.status(400).json({ error: 'Missing customer_id or dish_id' });
  }

  const query = 'INSERT INTO wishlist (customer_id, dish_id) VALUES (?, ?)';
  db.query(query, [customer_id, dish_id], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Dish already in wishlist' });
      }
      return res.status(500).json({ error: 'Failed to add to wishlist' });
    }
    res.status(201).json({ message: 'Added to wishlist successfully' });
  });
};

// Remove dish from wishlist
exports.removeFromWishlist = (req, res) => {
  const { customer_id, dish_id } = req.body;

  const query = 'DELETE FROM wishlist WHERE customer_id = ? AND dish_id = ?';
  db.query(query, [customer_id, dish_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to remove from wishlist' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Dish not found in wishlist' });
    }
    res.status(200).json({ message: 'Removed from wishlist' });
  });
};

// Get wishlist for a customer
exports.getWishlistByCustomer = (req, res) => {
  const customer_id = req.params.customerId;

  const query = `
    SELECT w.dish_id, d.name AS dish_name, d.price, d.image_url, d.is_veg, d.cuisine,
           u.name AS cook_name, u.rating
    FROM wishlist w
    JOIN dishes d ON w.dish_id = d.id
    JOIN users u ON d.cook_id = u.id
    WHERE w.customer_id = ?
  `;

  db.query(query, [customer_id], (err, results) => {
    if (err) {
      console.error('Error fetching wishlist:', err);
      return res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
    res.status(200).json(results);
  });
}; // 