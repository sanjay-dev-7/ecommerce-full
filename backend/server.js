const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const webhookRoutes = require('./src/routes/webhookRoutes');
const userRoutes = require('./src/routes/userRoutes'); // Points to src/routes

const app = express();

// Middlewares
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Allow Vite or CRA dev servers
    credentials: true, // Required for cookies / withCredentials: true
  })
);

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf; // Preserved for Razorpay webhook verification
    },
  })
);

app.use(cookieParser());
app.use(helmet());
app.use(morgan('dev'));

// API Routes
app.use('/api/webhooks', webhookRoutes);
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', userRoutes);
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/payments', require('./src/routes/paymentRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy and running.' });
});

// Database Connection & Server Startup
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI, {
    family: 4, // Force IPv4
  })
  .then(() => {
    console.log('✅ Successfully connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  });