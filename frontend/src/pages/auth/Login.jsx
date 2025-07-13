import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/authService';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await loginUser(email, password);
      const { token, user } = res;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      const decoded = jwtDecode(token);
      const expiry = decoded.exp * 1000;
      const now = Date.now();
      const timeLeft = expiry - now;

      if (timeLeft > 0) {
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, timeLeft);
      }

      if (user.role === 'customer') {
        navigate('/customer/dashboard');
      } else if (user.role === 'homecook') {
        navigate('/homecook/dashboard');
      } else {
        setError('Unknown user role');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tr from-pink-500 to-indigo-500 md:flex-row">
      {/* Left Branding Section */}
      <div className="hidden h-full w-full flex-col items-center justify-center p-10 text-black md:flex md:w-1/2">
        <div className="mb-6 rounded-2xl bg-amber-100/90 p-4 shadow-[0_4px_20px_rgba(255,255,255,0.4)]">
          <img
            src="https://static.wixstatic.com/media/252ab4_b1a3a5e602d240a1b41818e9ebca4165~mv2.png"
            alt="HomeCook Logo"
            className="w-72 rounded-xl"
          />
        </div>
        <h1 className="mb-4 text-4xl font-bold drop-shadow">HomeCook</h1>
        <p className="max-w-sm text-center text-lg font-medium italic drop-shadow">
          “Ab mile ghar ka swad, ghar ke bahar bhi”
        </p>
      </div>

      {/* Right Login Form Section */}
      <div className="w-full max-w-md rounded-none bg-white/30 p-8 shadow-xl backdrop-blur-md md:mx-auto md:my-12 md:rounded-2xl">
        <h2 className="mb-6 text-center text-3xl font-bold text-sky-200 drop-shadow">
          Login to HomeCook
        </h2>

        {error && (
          <div className="mb-4 rounded bg-red-100 px-4 py-2 text-sm text-red-700 shadow">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-sky-200 drop-shadow">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-white/40 bg-white/60 px-4 py-2 text-sm text-gray-800 shadow-sm placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-sky-200 drop-shadow">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-white/40 bg-white/60 px-4 py-2 text-sm text-gray-800 shadow-sm placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-white px-4 py-2 font-semibold text-pink-600 shadow-lg transition hover:scale-105 hover:bg-pink-100"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-sky-200 drop-shadow">
          New user?{' '}
          <a
            href="/register"
            className="font-medium underline hover:text-pink-100"
          >
            Click here to register
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
