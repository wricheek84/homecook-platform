import axios from 'axios';

const API = '/api';

const getAuthConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// 🔁 Get paginated customer orders
export const getCustomerOrders = async (token, page = 1, limit = 10) => {
  try {
    const res = await axios.get(
      `${API}/orders/customer?page=${page}&limit=${limit}`,
      getAuthConfig(token)
    );
    return res.data;
  } catch (error) {
    console.error('❌ Error fetching paginated customer orders:', error);
    return { orders: [], totalCount: 0 };
  }
};

// 🛒 Place Order
export const placeOrder = async (token, dishId, quantity = 1) => {
  return await axios.post(
    `${API}/orders`,
    { dish_id: dishId, quantity },
    getAuthConfig(token)
  );
};

// 💳 Create Stripe Checkout
export const createStripeSession = async (token, orderId) => {
  const res = await axios.post(
    `${API}/payments/create-checkout-session`,
    { orderId },
    getAuthConfig(token)
  );
  return res.data;
};

// 📄 Download PDF Receipt
export const downloadReceipt = async (token, orderId) => {
  try {
    const response = await axios.get(`${API}/payments/receipt/${orderId}`, {
      ...getAuthConfig(token),
      responseType: 'blob', // Needed for downloading files
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `HomeCook_Receipt_Order_${orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('❌ Error downloading receipt:', err);
    throw err;
  }
};
