import axios from 'axios';

const API = 'https://homecook-backend-7i7u.onrender.com/api';

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// 🔍 Get current customer address
export const getCustomerAddress = async () => {
  const res = await axios.get(`${API}`, getAuthConfig());
  return res.data;
};

// 💾 Save or update customer address
export const saveCustomerAddress = async (address) => {
  const res = await axios.post(`${API}`, address, getAuthConfig());
  return res.data;
};
