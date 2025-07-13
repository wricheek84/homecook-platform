const jwt = require('jsonwebtoken');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// 📝 Register
const registerUser = (req, res) => {
  const { name, email, password, role, location } = req.body;

  if (!name || !email || !password || !role || !location) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const normalizedEmail = email.toLowerCase();

  const checkQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkQuery, [normalizedEmail], async (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (results.length > 0) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = 'INSERT INTO users (name, email, password, role, location) VALUES (?, ?, ?, ?, ?)';
    db.query(insertQuery, [name, normalizedEmail, hashedPassword, role, location], (err, result) => {
      if (err) {
        console.error('❌ Error inserting user:', err);
        return res.status(500).json({ error: 'Insert failed' });
      }

      res.status(201).json({ message: 'User registered successfully' });
    });
  });
};

// 🔐 Login
const loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const normalizedEmail = email.toLowerCase();

  const checkQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkQuery, [normalizedEmail], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location
      }
    });
  });
};

// 👥 Get all users (admin/debug)
const getAllUsers = (req, res) => {
  // Optional: add admin check: if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const query = 'SELECT id, name, email, role, location FROM users';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    res.status(200).json(results);
  });
};

// 🍳 Get all homecooks (for customer to chat with)
const getAllHomecooks = (req, res) => {
  const query = 'SELECT id, name FROM users WHERE role = "homecook"';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching homecooks:', err);
      return res.status(500).json({ error: 'Failed to fetch homecooks' });
    }
    res.status(200).json(results);
  });
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getAllHomecooks
};
