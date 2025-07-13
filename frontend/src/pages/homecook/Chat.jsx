import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const socket = io(import.meta.env.VITE_BACKEND_URL); // ✅ Real socket connection

const HomecookChat = () => {
  const [homecook, setHomecook] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatRef = useRef();

  const token = localStorage.getItem('token');
  const BASE_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser?.role !== 'homecook') return;
    setHomecook(storedUser);

    axios
      .get(`${BASE_URL}/api/messages/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error('❌ Failed to fetch customers:', err));
  }, []);

  useEffect(() => {
    if (!selectedCustomer) return;

    axios
      .get(`${BASE_URL}/api/messages/${selectedCustomer.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data))
      .catch((err) => console.error('❌ Failed to fetch messages:', err));
  }, [selectedCustomer]);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!homecook) return;
    socket.emit('join', homecook.id.toString());

    socket.on('receiveMessage', (message) => {
      if (message.sender_id === selectedCustomer?.id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => socket.off('receiveMessage');
  }, [homecook, selectedCustomer]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedCustomer) return;

    const messageData = {
      receiver_id: selectedCustomer.id,
      message: input.trim(),
    };

    try {
      const res = await axios.post(`${BASE_URL}/api/messages`, messageData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages((prev) => [...prev, res.data]);
      socket.emit('sendMessage', {
        ...res.data,
        receiver_id: selectedCustomer.id,
        sender_id: homecook.id,
      });
      setInput('');
    } catch (error) {
      console.error('❌ Send message error:', error);
    }
  };

  return (
    <div className="flex h-[90vh] bg-gray-50">
      {/* Sidebar - Customer List */}
      <div className="w-1/4 border-r bg-white overflow-y-auto p-4">
        <h2 className="text-xl font-bold mb-4">💬 Customers</h2>
        {Array.isArray(customers) && customers.length === 0 ? (
          <p className="text-sm text-gray-500">No chats yet.</p>
        ) : (
          customers.map((cust) => (
            <div
              key={cust.id}
              onClick={() => setSelectedCustomer(cust)}
              className={`cursor-pointer p-2 rounded-lg mb-2 hover:bg-gray-100 ${
                selectedCustomer?.id === cust.id ? 'bg-blue-100 font-semibold' : ''
              }`}
            >
              {cust.name}
            </div>
          ))
        )}
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col justify-between p-4">
        {selectedCustomer ? (
          <>
            <div className="mb-2 text-lg font-semibold border-b pb-2">
              Chatting with {selectedCustomer.name}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[75%] px-4 py-2 rounded-lg shadow-sm ${
                    msg.sender_id === homecook?.id
                      ? 'bg-blue-500 text-white ml-auto text-right'
                      : 'bg-gray-200 text-gray-800 mr-auto text-left'
                  }`}
                >
                  {msg.message || msg.content}
                </div>
              ))}
              <div ref={chatRef} />
            </div>
            <div className="flex items-center mt-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a customer to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default HomecookChat;
