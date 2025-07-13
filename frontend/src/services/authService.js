import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/users';

// 🔓 Login function
export const loginUser = async (email, password) => {
  const response = await axios.post(`${API_BASE}/login`, { email, password });
  return response.data;
};

// 🆕 Register function
export const registerUser = async (userData) => {
  const response = await axios.post(`${API_BASE}/register`, userData);
  return response.data;
};
