// services/dishService.js
import axios from 'axios';

const API = '/api/dishes';

// 🔐 Include auth token in headers
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getDishesByLocation = async (city) => {
  try {
    const res = await axios.get(`https://homecook-backend-7i7u.onrender.com/api/dishes?city=${city}`);
    return Array.isArray(res.data) ? res.data : []; // ✅ always return array
  } catch (err) {
    console.error('❌ Error fetching dishes by location:', err);
    return [];
  }
};
