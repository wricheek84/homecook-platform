import React, { useEffect, useState } from 'react';
import {
  getHomecookOrders,
  getAllDishes,
  createDish,
  updateDish,
  deleteDish,
  updateOrderStatus,
} from '../../services/homecookService';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { z } from 'zod';

const dishSchema = z.object({
  name: z.string().min(1, 'Dish name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().refine((val) => !isNaN(val) && parseFloat(val) > 0, {
    message: 'Price must be a positive number',
  }),
  cuisine: z.string().min(1, 'Cuisine is required'),
});

const HomecookDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, revenue: 0 });
  const [formData, setFormData] = useState({ name: '', description: '', price: '', cuisine: '' });
  const [image, setImage] = useState(null);
  const [editId, setEditId] = useState(null);
  const navigate = useNavigate();

  const fetchOrdersAndStats = async () => {
    try {
      const orderData = await getHomecookOrders();
      setOrders(orderData);
      const total = orderData.length;
      const active = orderData.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;
      const revenue = orderData
        .filter((o) => ['paid', 'preparing', 'delivered'].includes(o.status))
        .reduce((sum, o) => sum + parseFloat(o.total_price), 0);
      setStats({ total, active, revenue });
    } catch (error) {
      console.error('❌ Error in fetchOrdersAndStats:', error);
    }
  };

  const fetchDishes = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const allDishes = await getAllDishes();
      const myDishes = allDishes.filter((dish) => dish.homecook_name === user.name);
      setDishes(myDishes);
    } catch (err) {
      console.error('❌ Error fetching dishes:', err);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = dishSchema.safeParse(formData);
    if (!validation.success) {
      const msg = validation.error.issues.map((issue) => `• ${issue.message}`).join('\n');
      alert(`Please fix the following:\n${msg}`);
      return;
    }

    try {
      if (editId) {
        await updateDish(editId, formData);
      } else {
        const form = new FormData();
        form.append('name', formData.name);
        form.append('description', formData.description);
        form.append('price', formData.price);
        form.append('cuisine', formData.cuisine);
        if (image) {
          form.append('image', image);
        }
        await createDish(form);
      }

      setFormData({ name: '', description: '', price: '', cuisine: '' });
      setImage(null);
      setEditId(null);
      fetchDishes();
    } catch (err) {
      console.error('❌ Error submitting dish form:', err);
    }
  };

  const handleEdit = (dish) => {
    setFormData({
      name: dish.name,
      description: dish.description,
      price: dish.price.toString(),
      cuisine: dish.cuisine,
    });
    setEditId(dish.id);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDish(id);
      fetchDishes();
    } catch (err) {
      console.error('❌ Error deleting dish:', err);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      fetchOrdersAndStats();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update status');
      console.error('❌ Error updating order status:', err);
    }
  };

  useEffect(() => {
    fetchOrdersAndStats();
    fetchDishes();

    const socket = io();
    const user = JSON.parse(localStorage.getItem('user'));
    socket.emit('join', user.id);

    socket.on('newOrder', () => fetchOrdersAndStats());
    socket.on('statusUpdate', () => fetchOrdersAndStats());

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-800 via-fuchsia-700 to-rose-700 p-6 space-y-6 text-pink-100 font-sans">
      <h1 className="text-4xl font-extrabold text-yellow-200 drop-shadow">🍳 Homecook Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-pink-700 rounded-2xl shadow-xl p-4">
          <h2 className="text-pink-200">Total Orders</h2>
          <p className="text-2xl font-bold text-yellow-100">{stats.total}</p>
        </div>
        <div className="bg-rose-600 rounded-2xl shadow-xl p-4">
          <h2 className="text-pink-200">Active Orders</h2>
          <p className="text-2xl font-bold text-yellow-100">{stats.active}</p>
        </div>
        <div className="bg-fuchsia-700 rounded-2xl shadow-xl p-4">
          <h2 className="text-pink-200">Total Revenue</h2>
          <p className="text-2xl font-bold text-yellow-100">₹{stats.revenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Dish Management */}
      <div className="bg-purple-700 rounded-2xl shadow-xl p-4 space-y-4">
        <h2 className="text-xl font-bold text-yellow-200">🍽️ My Dishes</h2>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Dish Name" className="bg-pink-600 text-white border-none px-3 py-2 rounded" />
          <input name="price" value={formData.price} onChange={handleChange} placeholder="Price (₹)" className="bg-pink-600 text-white border-none px-3 py-2 rounded" />
          <input name="cuisine" value={formData.cuisine} onChange={handleChange} placeholder="Cuisine" className="bg-pink-600 text-white border-none px-3 py-2 rounded" />
          <input name="description" value={formData.description} onChange={handleChange} placeholder="Short Description" className="bg-pink-600 text-white border-none px-3 py-2 rounded" />
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="sm:col-span-2 bg-fuchsia-600 text-white border-none px-3 py-2 rounded" />
          <button type="submit" className="sm:col-span-2 bg-yellow-400 text-rose-800 font-bold rounded py-2 hover:bg-yellow-300">
            {editId ? 'Update Dish' : 'Add Dish'}
          </button>
        </form>

        <div className="grid gap-4">
          {dishes.map((dish) => (
            <div key={dish.id} className="bg-rose-800 p-3 rounded flex justify-between items-start shadow">
              <div>
                <h3 className="font-semibold text-lg text-yellow-100">{dish.name}</h3>
                <p className="text-sm text-pink-200">₹{dish.price} | {dish.cuisine}</p>
                <p className="text-sm text-pink-300">{dish.description}</p>
                {dish.image_url && (
                  <img src={dish.image_url} alt={dish.name} className="mt-2 w-32 rounded shadow" />
                )}
              </div>
              <div className="space-x-2">
                <button onClick={() => handleEdit(dish)} className="text-yellow-200 hover:underline">Edit</button>
                <button onClick={() => handleDelete(dish.id)} className="text-pink-300 hover:underline">Delete</button>
              </div>
            </div>
          ))}
          {dishes.length === 0 && <p className="text-pink-200">No dishes added yet.</p>}
        </div>
      </div>

      {/* Orders */}
      <div className="bg-fuchsia-800 rounded-2xl shadow-xl p-4">
        <h2 className="text-xl font-bold text-yellow-200 mb-2">📦 Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-pink-100">
            <thead className="text-left bg-rose-700 text-yellow-100">
              <tr>
                <th className="p-2">Dish</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Status</th>
                <th className="p-2">Change Status</th>
                <th className="p-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isPaid = ['paid', 'preparing', 'delivered'].includes(order.status);
                return (
                  <tr key={order.id} className="border-b border-pink-600">
                    <td className="p-2">{order.dish_name}</td>
                    <td className="p-2">
                      <div className="font-medium">{order.customer_name}</div>
                      {order.delivery_address && (
                        <div className="mt-1 text-xs text-pink-200 whitespace-pre-wrap">
                          <strong>📍 Address:</strong><br />
                          {order.delivery_address}
                        </div>
                      )}
                    </td>
                    <td className="p-2">{order.quantity}</td>
                    <td className="p-2">₹{parseFloat(order.total_price).toFixed(2)}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'delivered' ? 'bg-green-600 text-white'
                        : order.status === 'preparing' ? 'bg-yellow-600 text-white'
                        : order.status === 'cancelled' ? 'bg-red-600 text-white'
                        : order.status === 'accepted' ? 'bg-orange-600 text-white'
                        : 'bg-blue-600 text-white'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <select
                        value={order.status}
                        onChange={(e) => {
                          const selected = e.target.value;
                          if ((selected === 'preparing' || selected === 'delivered') && !isPaid) {
                            alert('❌ Customer has not paid yet.');
                            return;
                          }
                          if (selected === order.status) return;
                          handleStatusChange(order.id, selected);
                        }}
                        className="text-sm bg-pink-700 text-white border-none rounded px-2 py-1"
                      >
                        {order.status === 'pending' && (
                          <option value="pending" disabled>
                            Pending (Waiting for acceptance)
                          </option>
                        )}
                        <option value="accepted">Accept Order</option>
                        <option value="preparing" disabled={!isPaid}>Preparing</option>
                        <option value="delivered" disabled={!isPaid}>Delivered</option>
                        <option value="cancelled">Cancel</option>
                      </select>
                    </td>
                    <td className="p-2">{new Date(order.order_time).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {orders.length === 0 && <p className="text-center text-pink-200 mt-4">No orders yet.</p>}
        </div>
      </div>

      {/* Chat Shortcut */}
      <div className="text-right">
        <button
          onClick={() => navigate('/homecook/chat')}
          className="px-4 py-2 bg-green-500 text-white font-semibold rounded hover:bg-green-400"
        >
          💬 Chat with Customers
        </button>
      </div>
    </div>
  );
};

export default HomecookDashboard;
