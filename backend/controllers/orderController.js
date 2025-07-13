const db = require('../config/db');
const { getIo } = require('../socket');

// 🛒 Place an Order
const placeOrder = (req, res) => {
  const customer_id = req.user.id;
  const { dish_id, quantity = 1 } = req.body;

  if (req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Only customers can place orders' });
  }

  if (!dish_id || isNaN(dish_id) || quantity <= 0 || isNaN(quantity)) {
    return res.status(400).json({ message: 'Invalid dish ID or quantity' });
  }

  // Step 1: Get dish price and cook_id
  const dishQuery = 'SELECT price, cook_id FROM dishes WHERE id = ?';
  db.query(dishQuery, [dish_id], (err, dishResults) => {
    if (err) {
      console.error('❌ Error fetching dish:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (dishResults.length === 0) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    const price = parseFloat(dishResults[0].price);
    const cook_id = dishResults[0].cook_id;
    const total_price = price * quantity;

    // Step 2: Get customer's most recent saved address
    const addressQuery = `
      SELECT full_name, phone_number, building, street, city, state, pincode, country
      FROM addresses
      WHERE customer_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    db.query(addressQuery, [customer_id], (err, addressResults) => {
      if (err) {
        console.error('❌ Error fetching address:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (addressResults.length === 0) {
        return res.status(400).json({ message: 'No saved address found. Please update your address.' });
      }

      const a = addressResults[0];
      const delivery_address = `${a.full_name}, ${a.phone_number}, ${a.building}, ${a.street}, ${a.city}, ${a.state}, ${a.pincode}, ${a.country}`;

      // Step 3: Insert order with address
      const orderQuery = `
        INSERT INTO orders (customer_id, cook_id, dish_id, quantity, total_price, delivery_address, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `;

      db.query(
        orderQuery,
        [customer_id, cook_id, dish_id, quantity, total_price, delivery_address],
        (err, result) => {
          if (err) {
            console.error('❌ Error placing order:', err);
            return res.status(500).json({ error: 'Failed to place order' });
          }

          // Emit to homecook via socket
          try {
            const io = getIo();
            io.to(cook_id.toString()).emit('newOrder', {
              id: result.insertId,
              customer_id,
              cook_id,
              dish_id,
              quantity,
              total_price,
              delivery_address,
              status: 'pending',
            });
          } catch (e) {
            console.warn('⚠️ Socket notification failed (non-blocking)');
          }

          res.status(201).json({
            message: 'Order placed successfully!',
            order: {
              id: result.insertId,
              customer_id,
              cook_id,
              dish_id,
              quantity,
              total_price,
              delivery_address,
              status: 'pending',
            },
          });
        }
      );
    });
  });
};

// ✅ Get Orders for Customer (with pagination)
const getCustomerOrders = (req, res) => {
  const customer_id = req.user.id;

  if (req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Only customers can view their orders' });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  const baseQuery = `
    SELECT orders.id, dishes.name AS dish_name, orders.quantity, orders.total_price,
           orders.status, orders.order_time, users.name AS cook_name
    FROM orders
    JOIN dishes ON orders.dish_id = dishes.id
    JOIN users ON orders.cook_id = users.id
    WHERE orders.customer_id = ?
    ORDER BY orders.order_time DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total FROM orders WHERE customer_id = ?
  `;

  db.query(baseQuery, [customer_id, limit, offset], (err, orders) => {
    if (err) {
      console.error('❌ Error fetching paginated orders:', err);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    db.query(countQuery, [customer_id], (err, countResult) => {
      if (err) {
        console.error('❌ Error fetching order count:', err);
        return res.status(500).json({ error: 'Failed to fetch order count' });
      }

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        orders,
        pagination: {
          total,
          page,
          totalPages,
          limit,
        },
      });
    });
  });
};

// ✅ Get Orders for Homecook
const getHomecookOrders = (req, res) => {
  const cook_id = req.user.id;

  if (req.user.role !== 'homecook') {
    return res.status(403).json({ message: 'Only homecooks can view their orders' });
  }

  const query = `
    SELECT orders.id, dishes.name AS dish_name, orders.quantity, orders.total_price,
           orders.status, orders.payment_status, orders.order_time, users.name AS customer_name,
           orders.delivery_address
    FROM orders
    JOIN dishes ON orders.dish_id = dishes.id
    JOIN users ON orders.customer_id = users.id
    WHERE orders.cook_id = ?
    ORDER BY orders.order_time DESC
  `;

  db.query(query, [cook_id], (err, results) => {
    if (err) {
      console.error('❌ Error fetching homecook orders:', err);
      return res.status(500).json({ error: 'Failed to fetch homecook orders' });
    }

    res.status(200).json(results);
  });
};

// ✅ Update Order Status (by Homecook)
const updateOrderStatus = (req, res) => {
  const cook_id = req.user.id;
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ['accepted', 'preparing', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const checkQuery = `SELECT * FROM orders WHERE id = ? AND cook_id = ?`;

  db.query(checkQuery, [orderId, cook_id], (err, results) => {
    if (err) {
      console.error('❌ Error checking order:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Order not found or unauthorized' });
    }

    const order = results[0];

    if (status !== 'accepted' && order.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Cannot update status before payment is done' });
    }

    if (order.status === status) {
      return res.status(400).json({ message: `Order is already marked as "${status}"` });
    }

    const updateQuery = `UPDATE orders SET status = ? WHERE id = ?`;

    db.query(updateQuery, [status, orderId], (err) => {
      if (err) {
        console.error('❌ Error updating status:', err);
        return res.status(500).json({ error: 'Failed to update status' });
      }

      try {
        const io = getIo();
        const customerId = order.customer_id;
        io.to(customerId.toString()).emit('statusUpdate', {
          orderId,
          newStatus: status,
        });
      } catch (socketError) {
        console.error('❌ Socket.io error:', socketError);
      }

      res.json({ message: `Order status updated to "${status}"` });
    });
  });
};

module.exports = {
  placeOrder,
  getCustomerOrders,
  getHomecookOrders,
  updateOrderStatus,
};
