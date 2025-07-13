import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import { jwtDecode } from 'jwt-decode'; // ✅ correct import

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import CustomerDashboard from './pages/customer/Dashboard';
import CustomerOrders from './pages/customer/Orders';
import CustomerChat from './pages/customer/Chat';
import Discover from './pages/customer/Discover';

import HomecookDashboard from './pages/homecook/Dashboard';
import HomecookChat from './pages/homecook/Chat';

const NotFound = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <h2 className="text-2xl font-bold text-red-600">404 - Page Not Found</h2>
  </div>
);

// 🔐 Logout function
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// ✅ Auth check on app load
const AuthWatcher = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const expiry = decoded.exp * 1000;
        const now = Date.now();

        if (now >= expiry) {
          toast.warning('🔒 Session expired. Please log in again.');
          setTimeout(() => logout(), 2000); // wait 2s before redirect
        }
      } catch (err) {
        logout(); // Invalid token format
      }
    }
  }, []);

  return null;
};

const App = () => {
  return (
    <Router>
      <AuthWatcher /> {/* 🔍 Token expiration checker */}
      <ToastContainer position="top-center" autoClose={3000} />
      <Routes>
        {/* 🔄 Redirect from "/" to "/login" */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 🔓 Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 👥 Customer Routes */}
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/orders" element={<CustomerOrders />} />
        <Route path="/customer/chat" element={<CustomerChat />} />
        <Route path="/customer/discover" element={<Discover />} />

        {/* 👨‍🍳 Homecook Routes */}
        <Route path="/homecook/dashboard" element={<HomecookDashboard />} />
        <Route path="/homecook/chat" element={<HomecookChat />} />

        {/* ❌ Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
