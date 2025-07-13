const db = require('../config/db');

// ✅ Add or Update Customer Address
const saveAddress = (req, res) => {
  const userId = req.user.id;
  const {
    full_name,
    phone_number,
    building,
    street,
    city,
    state,
    pincode,
    country
  } = req.body;

  if (!full_name || !phone_number || !building || !street || !city || !state || !pincode || !country) {
    return res.status(400).json({ error: 'All address fields are required' });
  }

  const checkQuery = 'SELECT * FROM addresses WHERE customer_id = ?';
  db.query(checkQuery, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    const updateUserLocation = (cb) => {
      const updateLocationQuery = 'UPDATE users SET location = ? WHERE id = ?';
      db.query(updateLocationQuery, [city, userId], (err) => {
        if (err) console.error('⚠️ Failed to update user location:', err);
        cb();
      });
    };

    if (results.length > 0) {
      const updateQuery = `
        UPDATE addresses SET full_name = ?, phone_number = ?, building = ?, street = ?, city = ?, state = ?, pincode = ?, country = ?
        WHERE customer_id = ?
      `;
      db.query(updateQuery, [full_name, phone_number, building, street, city, state, pincode, country, userId], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to update address' });

        updateUserLocation(() => {
          res.json({ message: '✅ Address and location updated successfully' });
        });
      });
    } else {
      const insertQuery = `
        INSERT INTO addresses (customer_id, full_name, phone_number, building, street, city, state, pincode, country)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(insertQuery, [userId, full_name, phone_number, building, street, city, state, pincode, country], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save address' });

        updateUserLocation(() => {
          res.json({ message: '✅ Address and location saved successfully' });
        });
      });
    }
  });
};


// ✅ Get Customer Address
const getAddress = (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT full_name, phone_number, building, street, city, state, pincode, country
    FROM addresses
    WHERE customer_id = ?
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching address:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'No address found' });
    }

    res.json(results[0]);
  });
};

module.exports = {
  saveAddress,
  getAddress,
};
