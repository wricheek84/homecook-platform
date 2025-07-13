const db = require('../config/db');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// 🧠 Helper: Upload image buffer to Cloudinary
const uploadFromBuffer = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'homecook_dishes' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// 🥘 Create Dish (with image upload)
const createDish = async (req, res) => {
  const { name, description, price, cuisine } = req.body;
  const cook_id = req.user.id;

  if (req.user.role !== 'homecook') {
    return res.status(403).json({ message: 'Only homecooks can add dishes' });
  }

  if (!name || !description || !price || isNaN(price) || price <= 0) {
    return res.status(400).json({ error: 'Invalid dish data' });
  }

  try {
    let imageUrl = null;

    if (req.file) {
      const result = await uploadFromBuffer(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const query = `
      INSERT INTO dishes (cook_id, name, description, price, cuisine, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [cook_id, name, description, price, cuisine, imageUrl], (err, result) => {
      if (err) {
        console.error('Error inserting dish:', err);
        return res.status(500).json({ error: 'Failed to add dish' });
      }

      return res.status(201).json({
        message: 'Dish added successfully!',
        imageUrl,
      });
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Something went wrong during upload' });
  }
};

// 📋 Get All Dishes (Filtered by Customer's City or Homecook's Own Dishes)
// 📋 Get All Dishes (Filtered by Customer's City or Homecook's Own Dishes)
const getAllDishes = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 👨‍🍳 If homecook, return only their own dishes
    if (user.role === 'homecook') {
      const query = `
        SELECT 
          dishes.id, 
          dishes.name, 
          dishes.description, 
          dishes.price,
          dishes.cook_id,
          dishes.cuisine,
          dishes.image_url,
          users.name AS homecook_name,
          users.location
        FROM dishes
        JOIN users ON dishes.cook_id = users.id
        WHERE cook_id = ?
      `;

      const [results] = await db.promise().query(query, [user.id]);
      return res.status(200).json(results);
    }

    // 👤 If customer, return dishes from cooks in their city
    if (user.role === 'customer') {
      const addressQuery = `
        SELECT city 
        FROM addresses 
        WHERE customer_id = ? 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;

      const [addressResults] = await db.promise().query(addressQuery, [user.id]);

      if (addressResults.length === 0 || !addressResults[0].city) {
        return res.status(400).json({ error: 'No address found. Please update your address to view dishes.' });
      }

      const customerCity = addressResults[0].city;

      const dishQuery = `
        SELECT 
          dishes.id, 
          dishes.name, 
          dishes.description, 
          dishes.price,
          dishes.cook_id,
          dishes.cuisine,
          dishes.image_url,
          users.name AS homecook_name, 
          users.location
        FROM dishes
        JOIN users ON dishes.cook_id = users.id
        WHERE LOWER(users.location) LIKE CONCAT('%', LOWER(?), '%')
        
      `;

      const [dishResults] = await db.promise().query(dishQuery, [customerCity]);
      return res.status(200).json(dishResults);
    }

    // 🚫 Fallback
    return res.status(403).json({ error: 'Invalid role for accessing dishes.' });

  } catch (error) {
    console.error('Unexpected error in getAllDishes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ✏️ Update Dish
const updateDish = (req, res) => {
  const dishId = req.params.id;
  const { name, description, price, cuisine } = req.body;
  const userId = req.user.id;

  if (!name || !description || !price || isNaN(price) || price <= 0 || !cuisine) {
    return res.status(400).json({ error: 'Invalid dish data. Please provide valid name, description, cuisine, and price.' });
  }

  const checkQuery = 'SELECT * FROM dishes WHERE id = ?';

  db.query(checkQuery, [dishId], (err, results) => {
    if (err) {
      console.error('Error fetching dish:', err);
      return res.status(500).json({ error: 'Failed to fetch dish' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    const dish = results[0];

    if (dish.cook_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this dish' });
    }

    const updateQuery = `
      UPDATE dishes
      SET name = ?, description = ?, price = ?, cuisine = ?
      WHERE id = ?
    `;

    db.query(updateQuery, [name, description, price, cuisine, dishId], (err) => {
      if (err) {
        console.error('Error updating dish:', err);
        return res.status(500).json({ error: 'Failed to update dish' });
      }

      return res.status(200).json({ message: 'Dish updated successfully!' });
    });
  });
};

// 📄 Get Dish by ID
const getDishById = (req, res) => {
  const dishId = req.params.id;

  const query = 'SELECT * FROM dishes WHERE id = ?';

  db.query(query, [dishId], (err, results) => {
    if (err) {
      console.error('Error fetching dish by ID:', err);
      return res.status(500).json({ error: 'Failed to fetch dish' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    return res.status(200).json(results[0]);
  });
};

// 🗑️ Delete Dish (only if owned by homecook)
const deleteDish = (req, res) => {
  const dishId = req.params.id;
  const userId = req.user.id;

  const checkQuery = 'SELECT * FROM dishes WHERE id = ?';

  db.query(checkQuery, [dishId], (err, results) => {
    if (err) {
      console.error('Error checking dish:', err);
      return res.status(500).json({ error: 'Failed to check dish' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    const dish = results[0];
    if (dish.cook_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this dish' });
    }

    const deleteQuery = 'DELETE FROM dishes WHERE id = ?';

    db.query(deleteQuery, [dishId], (err) => {
      if (err) {
        console.error('Error deleting dish:', err);
        return res.status(500).json({ error: 'Failed to delete dish' });
      }

      return res.status(200).json({ message: 'Dish deleted successfully!' });
    });
  });
};

module.exports = {
  createDish,
  getAllDishes,
  updateDish,
  getDishById,
  deleteDish
};
