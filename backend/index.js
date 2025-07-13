const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { setupSocket } = require('./socket');
const db = require('./config/db');

const userRoutes = require('./routes/userRoutes');
const dishRoutes = require('./routes/dishRoutes');
const orderRoutes = require('./routes/orderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');

const paymentRoutes = require('./routes/paymentRoutes');
const addressRoutes = require('./routes/addressRoutes'); // for normal payment routes
const { handleStripeWebhook } = require('./controllers/paymentController'); // webhook handler

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());

// ✅ Stripe webhook needs raw body, so handle it FIRST and manually
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// ✅ Then parse JSON for all other routes
app.use(express.json());

// ⬇️ Mount regular API routes
app.use('/api/users', userRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/customer/address', addressRoutes); // ✅ Matches frontend call
// for create-checkout-session etc.

app.get('/', (req, res) => {
  res.send('HomeCook backend running with real-time chat!');
});

// ✅ Setup socket.io
const io = setupSocket(server);

server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
