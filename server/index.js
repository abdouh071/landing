/**
 * Express Server Entry Point
 * E-commerce Landing Page & Admin Dashboard API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const productsRoutes = require('./routes/products');
const variantsRoutes = require('./routes/variants');
const ordersRoutes = require('./routes/orders');
const uploadRoutes = require('./routes/upload');
const settingsRoutes = require('./routes/settings');
const authRoutes = require('./routes/auth');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/products', productsRoutes);
app.use('/api/variants', variantsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);

// Algerias Wilayas & Communes endpoint
app.get('/api/wilayas', (req, res) => {
  res.sendFile(path.join(__dirname, 'wil.json'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🚀 Ecom-Shop Server running on http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('📄 Landing Page:  http://localhost:' + PORT);
  console.log('🔧 Dashboard:     http://localhost:' + PORT + '/dashboard');
  console.log('📡 API Health:    http://localhost:' + PORT + '/api/health');
  console.log('═══════════════════════════════════════════════════════');
});

module.exports = app;
