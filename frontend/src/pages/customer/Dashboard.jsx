import React, { useEffect, useState } from 'react';
import { getCustomerOrders, placeOrder, createStripeSession } from '../../services/orderService';
import { getWishlist, removeFromWishlist } from '../../services/wishlistService';
import { getCustomerAddress, saveCustomerAddress } from '../../services/customerService';
import { AiFillHeart } from 'react-icons/ai';
import Lottie from 'lottie-react';
import cookingAnimation from '../../assets/Cooking.json';

const CustomerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [stats, setStats] = useState({ total: 0, amount: 0, active: 0 });
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [address, setAddress] = useState({
    full_name: '',
    phone_number: '',
    building: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const limit = 5;

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getCustomerOrders(token, page, limit);
        const fetchedOrders = response?.orders || [];
        const fetchedCount = response?.totalCount || 0;

        setOrders(fetchedOrders);
        setTotalCount(fetchedCount);

        const total = fetchedCount;
        const amount = fetchedOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
        const active = fetchedOrders.filter(
          (o) => o.status !== 'delivered' && o.status !== 'cancelled'
        ).length;
        setStats({ total, amount, active });

        const wishlistData = await getWishlist(user.id);
        setWishlist(wishlistData);

        const addr = await getCustomerAddress();
        if (addr) setAddress(addr);
      } catch (err) {
        console.error('❌ Error fetching data:', err);
      }
    };

    if (user.id) fetchData();
  }, [user.id, token, page]);

  const handleRemoveFromWishlist = async (dishId) => {
    try {
      await removeFromWishlist(user.id, dishId);
      setWishlist((prev) => prev.filter((item) => item.dish_id !== dishId));
    } catch (err) {
      console.error('❌ Failed to remove from wishlist:', err);
    }
  };

  const handleOrderNow = async (dishId) => {
    try {
      await placeOrder(token, dishId, 1);
      alert('✅ Order placed successfully!');
      window.location.reload();
    } catch (err) {
      console.error('❌ Failed to place order:', err);
      alert('Failed to place order. Please try again.');
    }
  };

  const handlePayNow = async (orderId) => {
    try {
      const session = await createStripeSession(token, orderId);
      window.location.href = session.url;
    } catch (err) {
      console.error('❌ Failed to start Stripe session:', err);
      alert('Payment failed. Please try again.');
    }
  };

  const handleSaveAddress = async () => {
    try {
      await saveCustomerAddress(address);
      const updatedUser = { ...user, location: address.city };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setFeedbackMsg('✅ Address saved successfully!');
      setTimeout(() => {
        setFeedbackMsg(null);
        setAddressModalOpen(false);
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('❌ Failed to save address:', err);
      setFeedbackMsg('❌ Failed to save address. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Lottie
        animationData={cookingAnimation}
        loop
        autoplay
        className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-60"
      />

      <div className="relative z-10 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          👋 Welcome back, {user.name}
        </h1>
        <p className="text-sm text-gray-600 mb-6">📍 Location: {user.location}</p>

        <div className="mb-6">
          <button
            onClick={() => setAddressModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow"
          >
            🏠 Manage Delivery Address
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            ['Orders Placed', stats.total, '🧾', 'from-pink-500 to-pink-300'],
            ['Total Spent', `₹${stats.amount}`, '💰', 'from-green-500 to-green-300'],
            ['Active Orders', stats.active, '📦', 'from-blue-500 to-blue-300'],
          ].map(([label, value, icon, gradient]) => (
            <div
              key={label}
              className={`relative rounded-2xl p-6 bg-gradient-to-br ${gradient} text-white shadow-lg overflow-hidden bg-opacity-80`}
              style={{ backdropFilter: 'blur(6px)' }}
            >
              <div className="text-sm">{label}</div>
              <div className="text-3xl font-extrabold mt-2">{value}</div>
              <div className="absolute -bottom-4 -right-4 opacity-20 text-6xl">{icon}</div>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <AiFillHeart className="mr-2 text-red-500" />
          Your Wishlist
        </h2>

        {wishlist.length === 0 ? (
          <p className="text-gray-500 mb-10">No items in your wishlist.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
            {wishlist.map((dish) => (
              <div key={dish.dish_id} className="bg-white bg-opacity-90 rounded-xl shadow p-4 relative flex flex-col backdrop-blur">
                <button
                  className="absolute top-2 right-2 text-xl text-red-500 hover:text-red-700"
                  onClick={() => handleRemoveFromWishlist(dish.dish_id)}
                  title="Remove from Wishlist"
                >
                  <AiFillHeart />
                </button>
                <img
                  src={dish.image_url || '/placeholder.jpg'}
                  alt={dish.name}
                  className="w-full h-40 object-cover rounded"
                />
                <h3 className="text-lg font-bold mt-2">{dish.name}</h3>
                <p className="text-sm text-gray-500">{dish.location}</p>
                <p className="text-sm text-gray-600">By: {dish.homecook_name}</p>
                <p className="text-pink-600 font-semibold mt-1">₹{dish.price}</p>
                <button
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded shadow"
                  onClick={() => handleOrderNow(dish.dish_id)}
                >
                  🛒 Order Now
                </button>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-xl font-semibold text-gray-800 mb-4">🕒 Order History</h2>
        {orders.length === 0 ? (
          <div className="text-gray-500">No orders yet. Start exploring!</div>
        ) : (
          <>
            <div className="bg-rose-300 bg-opacity-90 rounded-2xl shadow-xl divide-y mb-8 backdrop-blur-md border border-rose-400">
              {orders.map((order) => (
                <div key={order.id} className="flex justify-between items-center p-4">
                  <div>
                    <p className="font-medium text-gray-700">
                      {order.dish_name} ×{order.quantity}
                    </p>
                    <p className="text-sm text-gray-500">Cooked by {order.cook_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-pink-600 font-semibold">
                      ₹{parseFloat(order.total_price).toFixed(2)}
                    </p>
                    <p
                      className={`text-sm ${
                        order.status === 'delivered'
                          ? 'text-green-600'
                          : order.status === 'preparing'
                          ? 'text-yellow-500'
                          : order.status === 'paid'
                          ? 'text-blue-600'
                          : order.status === 'accepted'
                          ? 'text-orange-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {order.status}
                    </p>
                    {order.status === 'accepted' && (
                      <button
                        className="mt-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={() => handlePayNow(order.id)}
                      >
                        Pay Now 💳
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 mb-8">
              <button
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                ⬅ Prev
              </button>
              <span className="text-sm text-gray-600 mt-2">Page {page}</span>
              <button
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-sm"
                disabled={page * limit >= totalCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next ➡
              </button>
            </div>
          </>
        )}

        <div className="text-center space-y-4">
          <button
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-2xl shadow transition"
            onClick={() => (window.location.href = '/customer/discover')}
          >
            🍽️ Browse Dishes
          </button>
          <br />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl shadow transition"
            onClick={() => (window.location.href = '/customer/chat')}
          >
            💬 Chat with Homecook
          </button>
          <br />
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl shadow transition"
            onClick={() => (window.location.href = '/customer/orders')}
          >
            📥 Download Receipts
          </button>
        </div>
      </div>

      {addressModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">🏠 Delivery Address</h2>
            {feedbackMsg && <div className="mb-2 text-sm">{feedbackMsg}</div>}
            {[
              ['Full Name', 'full_name'],
              ['Phone Number', 'phone_number'],
              ['Building', 'building'],
              ['Street', 'street'],
              ['City', 'city'],
              ['State', 'state'],
              ['Pincode', 'pincode'],
              ['Country', 'country'],
            ].map(([label, key]) => (
              <input
                key={key}
                type="text"
                placeholder={label}
                className="w-full border rounded px-3 py-2 mb-2"
                value={address[key]}
                onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
              />
            ))}
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => setAddressModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-400 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAddress}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
              >
                💾 Save Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
