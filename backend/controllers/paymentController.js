const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ✅ Create Stripe Checkout Session
const createCheckoutSession = (req, res) => {
  const { orderId } = req.body;
  const userId = req.user.id;

  if (!orderId) {
    return res.status(400).json({ error: 'Missing orderId' });
  }

  const query = 'SELECT total_price, customer_id, payment_status FROM orders WHERE id = ?';
  db.query(query, [orderId], async (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = results[0];

    if (order.customer_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to pay for this order' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    const amount = order.total_price;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: `Order #${orderId}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: 'http://localhost:5173/customer/orders?payment=success',
        cancel_url: 'http://localhost:5173/customer/orders?payment=cancel',
        metadata: {
          orderId: String(orderId),
        },
      });

      console.log(`✅ Stripe session created for order ${orderId}`);
      res.json({ url: session.url });
    } catch (stripeError) {
      console.error('❌ Stripe session error:', stripeError);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });
};

// ✅ Stripe Webhook - Mark Order as Paid
const handleStripeWebhook = (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.error('❌ Webhook missing orderId metadata');
      return res.status(400).json({ error: 'Missing metadata' });
    }

    const updateQuery = `
      UPDATE orders 
      SET status = 'paid', payment_status = 'paid' 
      WHERE id = ?
    `;

    db.query(updateQuery, [orderId], (err, result) => {
      if (err) {
        console.error(`❌ Failed to mark order ${orderId} as paid:`, err);
        return;
      }

      if (result.affectedRows === 0) {
        console.warn(`⚠️ Order ${orderId} not found or already updated`);
      } else {
        console.log(`✅ Order ${orderId} marked as paid`);
      }
    });
  }

  res.status(200).json({ received: true });
};

// ✅ Generate PDF Receipt for a Paid Order
const generateReceiptPDF = (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.user.id;

  const query = `
    SELECT o.id, o.total_price, o.order_time, d.name AS dish_name, u.name AS cook_name
    FROM orders o
    JOIN dishes d ON o.dish_id = d.id
    JOIN users u ON o.cook_id = u.id
    WHERE o.id = ? AND o.customer_id = ? AND o.payment_status = 'paid'
  `;

  db.query(query, [orderId, userId], (err, results) => {
    if (err) {
      console.error('❌ DB error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Receipt not available for this order' });
    }

    const order = results[0];

    const doc = new PDFDocument();
    const filename = `receipt_order_${order.id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    doc.pipe(res);

    // 🎫 Receipt content
    doc.fontSize(22).text('🍽️ HomeCook - Payment Receipt', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Order ID: ${order.id}`);
    doc.text(`Dish: ${order.dish_name}`);
    doc.text(`Cook: ${order.cook_name}`);
    doc.text(`Total Paid: ₹${order.total_price}`);
    doc.text(`Date: ${new Date(order.order_time).toLocaleString()}`);
    doc.moveDown();
    doc.text('✅ Thank you for using HomeCook! Bon appétit!', { align: 'center' });

    doc.end();
  });
};

module.exports = {
  createCheckoutSession,
  handleStripeWebhook,
  generateReceiptPDF, // 👈 Added export
};
