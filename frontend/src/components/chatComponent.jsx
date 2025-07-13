import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const ChatComponent = ({ userId, receiverId, token }) => {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const messagesEndRef = useRef(null);

  // Socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    newSocket.emit('join', userId);
    setSocket(newSocket);

    newSocket.on('receive_message', (data) => {
      const formatted = {
        sender_id: data.sender_id || data.senderId,
        receiver_id: data.receiver_id || data.receiverId,
        message: data.message,
      };

      if (
        (formatted.sender_id === receiverId && formatted.receiver_id === userId) ||
        (formatted.sender_id === userId && formatted.receiver_id === receiverId)
      ) {
        setChat((prev) => [...prev, formatted]);
      }
    });

    return () => newSocket.disconnect();
  }, [userId, receiverId]);

  // Fetch existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/messages/${receiverId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChat(res.data);
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };

    fetchMessages();
  }, [receiverId, token]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const sendMessage = async () => {
    if (message.trim() === '') return;

    const msgData = {
      receiver_id: receiverId,
      message,
    };

    try {
      await axios.post('http://localhost:5000/api/messages', msgData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newMsg = {
        sender_id: userId,
        receiver_id: receiverId,
        message,
      };

      socket.emit('send_message', newMsg);
      setChat((prev) => [...prev, newMsg]);
      setMessage('');
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg w-full max-w-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center">Real-Time Chat</h2>

      <div className="h-80 overflow-y-scroll p-4 bg-gray-800 rounded-md space-y-2">
        {chat.map((msg, idx) => {
          const isSender = msg.sender_id === userId;
          return (
            <div
              key={idx}
              className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm break-words ${
                  isSender
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-300 text-black rounded-bl-none'
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex mt-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 px-4 py-2 rounded-l-md text-black"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatComponent;