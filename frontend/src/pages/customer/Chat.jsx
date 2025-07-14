import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const socket = io(import.meta.env.VITE_BACKEND_URL);

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [homecooks, setHomecooks] = useState([]);
  const [selectedCook, setSelectedCook] = useState(null);
  const messagesEndRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCookId = queryParams.get('cookId');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ Fetch homecooks once
  useEffect(() => {
    if (user?.id) {
      socket.emit('join', user.id);
    }

    const fetchHomecooks = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/homecooks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHomecooks(res.data);
      } catch (err) {
        console.error('❌ Failed to fetch homecooks', err);
      }
    };

    fetchHomecooks();

    return () => {
      socket.disconnect();
    };
  }, []);

  // ✅ Listen for messages separately
  useEffect(() => {
    const handleIncoming = (msg) => {
      if (msg.sender_id === selectedCook?.id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('receiveMessage', handleIncoming);

    return () => {
      socket.off('receiveMessage', handleIncoming);
    };
  }, [selectedCook?.id]);

  // ✅ Preselect cook from URL param after cooks are fetched
  useEffect(() => {
    if (!initialCookId || homecooks.length === 0) return;
    const matched = homecooks.find(c => c.id.toString() === initialCookId);
    if (matched) {
      setSelectedCook(matched);
    } else {
      console.warn('Cook ID from URL not found in homecooks:', initialCookId);
    }
  }, [initialCookId, homecooks]);

  // ✅ Fetch old messages when cook selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedCook) return;
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/messages/${selectedCook.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(res.data);
      } catch (err) {
        console.error('❌ Error fetching messages', err);
      }
    };

    fetchMessages();
  }, [selectedCook?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedCook) return;

    const messageData = {
      receiver_id: selectedCook.id,
      message: input.trim(),
    };

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/messages`,
        messageData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newMsg = res.data;
      setMessages((prev) => [...prev, newMsg]);

      socket.emit('sendMessage', {
        ...newMsg,
        sender_id: user.id,
        receiver_id: selectedCook.id,
      });

      setInput('');
    } catch (err) {
      console.error('❌ Send message error:', err);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-100 border-r p-4">
        <h2 className="text-lg font-bold mb-4">Homecooks</h2>
        <ul>
          {homecooks.map((cook) => (
            <li
              key={cook.id}
              className={`p-2 mb-2 rounded cursor-pointer ${
                selectedCook?.id === cook.id ? 'bg-pink-200' : 'hover:bg-gray-200'
              }`}
              onClick={() => setSelectedCook(cook)}
            >
              {cook.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="p-4 border-b bg-white shadow">
          <h2 className="font-semibold">
            {selectedCook ? `Chatting with ${selectedCook.name}` : 'Select a homecook'}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {selectedCook ? (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 max-w-md px-4 py-2 rounded-lg ${
                  msg.sender_id === user.id
                    ? 'bg-blue-500 text-white self-end ml-auto'
                    : 'bg-gray-200 text-gray-800 self-start mr-auto'
                }`}
              >
                {msg.message}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center mt-10">
              Select a homecook to start chatting.
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {selectedCook && (
          <div className="p-4 border-t bg-white flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none"
              placeholder="Type your message..."
            />
            <button
              onClick={sendMessage}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-r-lg"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
