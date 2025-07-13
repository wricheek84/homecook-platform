import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/authService';

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email || !password || !role || !location) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      await registerUser({ name, email, password, role, location });
      setSuccess('Registration successful! You can now log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-start bg-cover bg-center bg-no-repeat bg-fixed px-4"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1920&q=80')",
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white/90 p-8 shadow-lg backdrop-blur-sm max-h-[90vh] overflow-y-auto ml-8">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Register for HomeCook
        </h2>

        {error && (
          <div className="mb-4 rounded bg-red-100 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded bg-green-100 px-4 py-2 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              className="w-full rounded border px-3 py-2 text-sm shadow-sm focus:border-pink-500 focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="w-full rounded border px-3 py-2 text-sm shadow-sm focus:border-pink-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="w-full rounded border px-3 py-2 text-sm shadow-sm focus:border-pink-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              className="w-full rounded border px-3 py-2 text-sm shadow-sm focus:border-pink-500 focus:outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="customer">Customer</option>
              <option value="homecook">Homecook</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              placeholder="City, State, Locality"
              className="w-full rounded border px-3 py-2 text-sm shadow-sm focus:border-pink-500 focus:outline-none"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded bg-pink-600 px-4 py-2 text-white transition hover:bg-pink-700"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
