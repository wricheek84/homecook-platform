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

export const getCustomerAddress = async () => {
  const res = await axios.get(`${API}/customer/address`, getAuthConfig());
  return res.data;
};


export const saveCustomerAddress = async (address) => {
  const res = await axios.post(`${API}/customer/address`, address, getAuthConfig());
  return res.data;
};