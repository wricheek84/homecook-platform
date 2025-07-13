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

// 🍽️ Get dishes filtered by customer's city (based on delivery address city)
export const getDishesByLocation = async (city) => {
  const res = await axios.get(`${API}?city=${encodeURIComponent(city)}`, getAuthConfig());
  return res.data;
};
