import axios from 'axios';

const API = '/api';

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// 📦 Get Orders for Homecook
export const getHomecookOrders = async () => {
  try {
    console.log('📡 Calling GET /api/orders/incoming...');
    const res = await axios.get(`${API}/orders/incoming`, getAuthConfig());
    console.log('✅ Response from /api/orders/incoming:', res.data);

    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('❌ Error fetching homecook orders:', error);
    return [];
  }
};

// 🍽️ Get All Dishes (then filter by cook name in frontend)
export const getAllDishes = async () => {
  try {
    console.log('📡 Calling GET /api/dishes...');
    const res = await axios.get(`${API}/dishes`, getAuthConfig()); // ✅ fixed
    return res.data;
  } catch (err) {
    console.error('❌ Error fetching dishes:', err);
    throw err;
  }
};

// ➕ Create Dish (with optional image upload)
export const createDish = async (data) => {
  try {
    console.log('📡 Creating dish...');
    await axios.post(`${API}/dishes`, data, {
      ...getAuthConfig(),
      // ✅ Do NOT set 'Content-Type' manually if sending FormData
    });
  } catch (error) {
    console.error('❌ Error creating dish:', error);
    throw error;
  }
};

// ✏️ Update Dish (text only, no image update for now)
export const updateDish = async (id, data) => {
  try {
    console.log(`📡 Updating dish ${id} with data:`, data);
    await axios.put(`${API}/dishes/${id}`, data, getAuthConfig());
  } catch (error) {
    console.error('❌ Error updating dish:', error);
    throw error;
  }
};

// ❌ Delete Dish
export const deleteDish = async (id) => {
  try {
    console.log(`📡 Deleting dish ${id}`);
    await axios.delete(`${API}/dishes/${id}`, getAuthConfig());
  } catch (error) {
    console.error('❌ Error deleting dish:', error);
    throw error;
  }
};

// ✅ Update Order Status (for status dropdown in dashboard)
export const updateOrderStatus = async (orderId, status) => {
  try {
    console.log(`📡 Updating order ${orderId} to status:`, status);
    await axios.put(`${API}/orders/${orderId}/status`, { status }, getAuthConfig());
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    throw error;
  }
};
