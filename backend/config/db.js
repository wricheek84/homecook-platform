const mysql = require('mysql2');
require('dotenv').config();

// Use connection string from .env (DB_URL)
const connection = mysql.createConnection(process.env.DB_URL);

connection.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:');
    console.error('👉 Full error:', err);
  } else {
    console.log('✅ MySQL connected successfully!');
  }
});

module.exports = connection;
