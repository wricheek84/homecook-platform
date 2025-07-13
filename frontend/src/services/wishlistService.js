// src/services/wishlistService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/wishlist';

// ✅ Add dish to wishlist
export const addToWishlist = async (customerId, dishId) => {
  try {
    const res = await axios.post(API_URL, { customer_id: customerId, dish_id: dishId });
    return res.data;
  } catch (err) {
    console.error('Failed to add to wishlist:', err.response?.data || err.message);
    throw err;
  }
};

// ✅ Remove dish from wishlist
export const removeFromWishlist = async (customerId, dishId) => {
  try {
    const res = await axios.delete(API_URL, {
      data: { customer_id: customerId, dish_id: dishId }
    });
    return res.data;
  } catch (err) {
    console.error('Failed to remove from wishlist:', err.response?.data || err.message);
    throw err;
  }
};

// ✅ Get wishlist for a customer
export const getWishlist = async (customerId) => {
  try {
    const res = await axios.get(`${API_URL}/${customerId}`);
    return res.data; // returns array of dishes
  } catch (err) {
    console.error('Failed to fetch wishlist:', err.response?.data || err.message);
    throw err;
  }
};
