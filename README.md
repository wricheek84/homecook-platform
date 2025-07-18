# React + Vite
# 🍛 Homecook Platform

A MERN-based food delivery app that connects **homecooks** with **local customers** looking for fresh, homemade meals. Customers can browse dishes from their city, place orders, track deliveries, and manage wishlists — while homecooks can upload dishes, handle orders, and view earnings.

---

## ✨ Features

### 👨‍🍳 For Homecooks:
- Add, edit, or delete dishes with images
- View and update order statuses (Pending → Accepted → Delivered)
- Dashboard shows current orders and dish listings

### 🧑‍🍳 For Customers:
- Discover dishes **only from your city**
- Search, sort, and filter dishes by price
- Add or remove items from your **wishlist**
- Place orders and pay via **Stripe**
- View all past orders and active ones
- Manage and update **delivery address** anytime

---

## 🧱 Tech Stack

| Layer        | Technology                   |
|--------------|------------------------------|
| Frontend     | React + Tailwind CSS         |
| Backend      | Node.js + Express            |
| Database     | MySQL with Sequelize ORM     |
| Auth         | JWT-based authentication     |
| Payments     | Stripe Integration           |
| Hosting      | Vercel (Frontend), Render (Backend), PlanetScale (DB) |

---

## 📁 Folder Structure

homecook-platform/
├── backend/ # Node.js API with MySQL DB
├── frontend/ # React frontend (Vite + Tailwind)
## 🚀 Running the App Locally

### 1. Clone the repository
```bash
git clone https://github.com/wricheek84/homecook-platform.git
##start the backend
cd homecook-platform
cd backend
npm install
# Create a .env file and add:
# DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, STRIPE_SECRET_KEY
node index.js
##start the frontend
cd ../frontend
npm install
npm run dev
###  How City-based Dish Filtering Works

```markdown
---

## 📍 Location-Based Filtering

- After login, customers enter a **delivery address**
- The selected city is saved to their profile
- Dishes shown on the Discover page are only from that city
- All search/filter/sort happens within that city’s results
-customer can pay for their food through stripe payment
## 🧑‍🍳 Homecook Dashboard Logic

- The dashboard shows all dishes **created by the logged-in homecook**
- Orders placed by customers are shown with their:
  - Dish info
  - Delivery address
  - Customer contact
- Homecooks can **update order status** from:
  - `Pending` → `Accepted` → `Delivered`
- Real-time status helps both customers and homecooks track progress
- Dishes can be:
  - Added (with image upload)
  - Edited (update price/description/etc.)
  - Deleted
- Only homecooks see this dashboard — customers have a different view

## 👤 Author

**Wricheek Bhunia**  
📧 wricheekbhunia599@gmail.com    
🌐 [GitHub](https://github.com/wricheek84)  
🔗 [LinkedIn](https://www.linkedin.com/in/wricheek-bhunia-0322b6349/)