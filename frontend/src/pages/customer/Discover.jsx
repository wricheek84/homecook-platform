import React, { useState, useEffect } from 'react';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../../services/wishlistService';
import { placeOrder } from '../../services/orderService';
import { getCustomerAddress } from '../../services/customerService';
import { getDishesByLocation } from '../../services/dishService';

import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { FaUtensils } from 'react-icons/fa';
import { Dialog } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';

const Discover = () => {
  const [dishes, setDishes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [modalDish, setModalDish] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [noCity, setNoCity] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    maxPrice: 1000,
    sortBy: '',
  });

  const [activeFilters, setActiveFilters] = useState(null);

  const navigate = useNavigate();
  const customer = JSON.parse(localStorage.getItem('user'));
  const customerId = customer?.id;
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetch = async () => {
      try {
        const address = await getCustomerAddress();

        if (!address?.city) {
          setNoCity(true);
          return;
        }

        const res = await getDishesByLocation(address.city);

        setDishes(res);
        setFiltered(res);

        const wishRes = await getWishlist(customerId);
        setWishlist(wishRes.map(i => i.dish_id));
      } catch (err) {
        if (err?.response?.status === 400) {
          setNoCity(true);
        }
        console.error('❌ Failed to fetch dishes or wishlist:', err);
      }
    };

    if (customerId) fetch();
  }, [customerId]);

  useEffect(() => {
    if (!activeFilters) return;

    const safeString = s => (typeof s === 'string' ? s.toLowerCase() : '');
    const searchTerm = activeFilters.search.toLowerCase();

    let arr = dishes.filter(d =>
      safeString(d.name).includes(searchTerm) ||
      safeString(d.homecook_name).includes(searchTerm) ||
      safeString(d.location).includes(searchTerm)
    );

    arr = arr.filter(d => parseFloat(d.price) <= activeFilters.maxPrice);

    switch (activeFilters.sortBy) {
      case 'priceAsc':
        arr.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'priceDesc':
        arr.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'nameAsc':
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFiltered(arr);
  }, [activeFilters, dishes]);

  const toggleWishlist = async id => {
    try {
      if (wishlist.includes(id)) {
        await removeFromWishlist(customerId, id);
        setWishlist(w => w.filter(i => i !== id));
      } else {
        await addToWishlist(customerId, id);
        setWishlist(w => [...w, id]);
      }
    } catch (err) {
      console.error('❌ Wishlist error:', err);
    }
  };

  const handleOrderNow = async () => {
    try {
      await placeOrder(token, modalDish.id, quantity);
      alert('✅ Order placed successfully!');
      setModalDish(null);
      setQuantity(1);
    } catch (err) {
      alert('❌ Failed to place order.');
      console.error(err);
    }
  };

  const handleChat = () => {
    if (modalDish?.cook_id) {
      navigate(`/customer/chat?cookId=${modalDish.cook_id}`);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage:
          "url('https://plus.unsplash.com/premium_photo-1690267599207-1df7a63e7f88?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8ZGFyayUyMGZvb2QlMjBwaG90b2dyYXBoeXxlbnwwfHwwfHx8MA%3D%3D')",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>

      <div className="relative z-10 p-6">
        <h1 className="text-3xl font-bold mb-6 flex items-center text-white drop-shadow">
          Discover <FaUtensils className="ml-2" />
        </h1>

        {noCity ? (
          <p className="text-red-300 text-sm mb-4 bg-white bg-opacity-60 px-3 py-2 rounded inline-block">
            ⚠️ Please save your delivery address first to see dishes in your city.
          </p>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white bg-opacity-80 rounded-lg shadow-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search by dish, cook, location"
                className="p-2 border rounded col-span-1"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              />

              <label className="col-span-1">
                Price: ₹{filters.maxPrice}
                <input
                  type="range"
                  min={0}
                  max={1000}
                  value={filters.maxPrice}
                  onChange={e =>
                    setFilters(f => ({ ...f, maxPrice: +e.target.value }))
                  }
                  className="w-full"
                />
              </label>

              <label className="col-span-1 md:col-span-1">
                Sort By:
                <select
                  value={filters.sortBy}
                  onChange={e =>
                    setFilters(f => ({ ...f, sortBy: e.target.value }))
                  }
                  className="ml-2 p-1 border rounded w-full"
                >
                  <option value="">None</option>
                  <option value="priceAsc">Price ↑</option>
                  <option value="priceDesc">Price ↓</option>
                  <option value="nameAsc">Name A‑Z</option>
                </select>
              </label>

              <div className="col-span-1 flex gap-2 justify-end items-end">
                <button
                  onClick={() => setActiveFilters(filters)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
                >
                  Search
                </button>
                <button
                  onClick={() => {
                    const reset = { search: '', maxPrice: 1000, sortBy: '' };
                    setFilters(reset);
                    setActiveFilters(null);
                    setFiltered(dishes);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded shadow"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Dish Grid */}
            {filtered.length === 0 ? (
              <p className="text-center text-white">No dishes to display.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filtered.map(d => (
                  <div
                    key={d.id}
                    className="bg-white rounded-lg shadow-lg p-4 relative transition hover:scale-[1.02]"
                  >
                    <button
                      className="absolute top-2 right-2 text-xl"
                      onClick={() => toggleWishlist(d.id)}
                    >
                      {wishlist.includes(d.id) ? (
                        <AiFillHeart className="text-red-500" />
                      ) : (
                        <AiOutlineHeart className="text-gray-400" />
                      )}
                    </button>
                    <img
                      src={d.image_url || '/placeholder.jpg'}
                      alt={d.name}
                      className="w-full h-40 object-cover rounded cursor-pointer"
                      onClick={() => {
                        setModalDish(d);
                        setQuantity(1);
                      }}
                    />
                    <h2
                      className="text-lg font-semibold mt-2 cursor-pointer"
                      onClick={() => setModalDish(d)}
                    >
                      {d.name}
                    </h2>
                    <p className="text-sm text-gray-600">{d.location}</p>
                    <p className="text-sm">By: {d.homecook_name}</p>
                    <p className="text-sm font-semibold">₹{d.price}</p>
                    <p className="text-yellow-500">⭐ 4.5</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {modalDish && (
          <Dialog
            open={true}
            onClose={() => setModalDish(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-lg overflow-auto relative">
              <button
                className="absolute top-2 right-2 text-2xl"
                onClick={() => setModalDish(null)}
              >
                ×
              </button>
              <img
                src={modalDish.image_url || '/placeholder.jpg'}
                alt={modalDish.name}
                className="w-full h-64 object-cover rounded mb-4"
              />
              <h2 className="text-2xl font-semibold">{modalDish.name}</h2>
              <p className="text-md text-gray-600">
                {modalDish.location} | By {modalDish.homecook_name}
              </p>
              <p className="mt-4">
                {modalDish.description || 'Delicious home-cooked meal.'}
              </p>
              <p className="mt-2 text-lg font-bold">₹{modalDish.price}</p>
              <p className="text-sm text-yellow-500 mt-1">⭐ 4.5</p>

              <div className="mt-4">
                <label className="font-medium text-sm text-gray-700 mr-2">
                  Quantity:
                </label>
                <select
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="border rounded px-3 py-1"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleOrderNow}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Order Now
                </button>
                <button
                  onClick={handleChat}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Chat with Cook
                </button>
              </div>
            </Dialog.Panel>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Discover;
