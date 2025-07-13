const db = require('../config/db');

// 📨 Send a Message
const sendMessage = (req, res) => {
  const sender_id = req.user.id;
  const { receiver_id, message } = req.body;

  console.log('📨 Incoming message:');
  console.log('From (sender_id):', sender_id);
  console.log('To (receiver_id):', receiver_id);
  console.log('Content:', message);

  // ✅ Fix: Ensure both receiver_id and message are valid
  if (!receiver_id || typeof receiver_id !== 'number') {
    return res.status(400).json({ error: 'Valid receiver_id is required' });
  }
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const query = `
    INSERT INTO messages (sender_id, receiver_id, message)
    VALUES (?, ?, ?)
  `;

  db.query(query, [sender_id, receiver_id, message], (err, result) => {
    if (err) {
      console.error('❌ Error inserting message:', err);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    const newMessage = {
      id: result.insertId,
      sender_id,
      receiver_id,
      message,
      timestamp: new Date(),
    };

    res.status(201).json(newMessage);
  });
};

// 📜 Get All Messages Between Two Users
const getMessages = (req, res) => {
  const userId = req.user.id;
  const { otherUserId } = req.params;

  const query = `
    SELECT id, sender_id, receiver_id, message, timestamp
    FROM messages
    WHERE (sender_id = ? AND receiver_id = ?)
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY timestamp ASC
  `;

  db.query(query, [userId, otherUserId, otherUserId, userId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching messages:', err);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    res.status(200).json(results);
  });
};

// 👥 Get Customers the Homecook Has Chatted With
const getCustomersChattedWith = (req, res) => {
  const homecookId = req.user.id;

  if (req.user.role !== 'homecook') {
    return res.status(403).json({ error: 'Only homecooks can access this' });
  }

  const query = `
    SELECT DISTINCT u.id, u.name
    FROM users u
    JOIN messages m
      ON (u.id = m.sender_id AND m.receiver_id = ?)
      OR (u.id = m.receiver_id AND m.sender_id = ?)
    WHERE u.role = 'customer'
  `;

  db.query(query, [homecookId, homecookId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching customers:', err);
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }

    res.status(200).json(results);
  });
};

module.exports = {
  sendMessage,
  getMessages,
  getCustomersChattedWith,
};
