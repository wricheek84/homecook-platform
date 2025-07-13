import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getCustomerOrders,
  createStripeSession,
  downloadReceipt, // ✅ added
} from '../../services/orderService';

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const token = localStorage.getItem('token');
  const location = useLocation();

  // ✅ Show payment success/failure message
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');

    if (paymentStatus === 'success') {
      setMessage('✅ Payment successful! Your order has been confirmed.');
      setMessageType('success');
    } else if (paymentStatus === 'cancel') {
      setMessage('❌ Payment was cancelled. No money was charged.');
      setMessageType('error');
    }

    if (paymentStatus) {
      const newParams = new URLSearchParams(location.search);
      newParams.delete('payment');
      window.history.replaceState({}, '', `${location.pathname}?${newParams}`);
    }

    const timer = setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);

    return () => clearTimeout(timer);
  }, [location]);

  // ✅ Fetch paginated customer orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getCustomerOrders(token, page);
        setOrders(res.orders || []);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        console.error('❌ Error fetching orders:', err);
      }
    };

    fetchOrders();
  }, [token, page]);

  const handlePayNow = async (orderId) => {
    try {
      const session = await createStripeSession(token, orderId);
      window.location.href = session.url;
    } catch (err) {
      console.error('❌ Failed to start Stripe session:', err);
      alert('Something went wrong while starting payment!');
    }
  };

  const handleDownloadReceipt = async (orderId) => {
    try {
      await downloadReceipt(token, orderId);
    } catch (err) {
      console.error('❌ Error downloading receipt:', err);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Your Orders</h2>

      {/* ✅ Toast message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-md shadow ${
            messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      {/* ✅ Order Cards */}
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders found.</p>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div key={order.id} className="border p-4 rounded-lg shadow bg-white">
              <h3 className="text-lg font-semibold">{order.dish_name}</h3>
              <p className="text-sm text-gray-600">Cook: {order.cook_name}</p>
              <p className="text-sm">Quantity: {order.quantity}</p>
              <p className="text-sm">Total Price: ₹{order.total_price}</p>
              <p className="text-sm">
                Status:{' '}
                <span className="font-semibold capitalize">
                  {order.status === 'paid'
                    ? '✅ Paid'
                    : order.status === 'pending_payment'
                    ? '🕒 Pending Payment'
                    : order.status}
                </span>
              </p>

              {/* 🟢 Show "Pay Now" button if not paid */}
              {order.status === 'pending_payment' && (
                <button
                  onClick={() => handlePayNow(order.id)}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Pay Now 💳
                </button>
              )}

              {/* 🟢 Show "Download Receipt" button only for paid orders */}
              {order.status === 'paid' && (
                <button
                  onClick={() => handleDownloadReceipt(order.id)}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                >
                  📄 Download Receipt
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ✅ Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;
