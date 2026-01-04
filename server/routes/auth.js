/**
 * Auth API Routes
 * Handle user authentication
 */

const express = require('express');
const router = express.Router();
const { admin, useMockMode } = require('../services/firebase');

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check credentials (strictly from .env)
    const validEmail = process.env.ADMIN_EMAIL;
    const validPassword = process.env.ADMIN_PASSWORD;

    if (!validEmail || !validPassword) {
      console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env');
      return res.status(500).json({ error: 'Server configuration error: Credentials not set' });
    }

    if (email === validEmail && password === validPassword) {
      // Generate a session token
      const token = `session-token-${Date.now()}`;
      return res.json({ 
        success: true, 
        token, 
        user: { email: validEmail, role: 'admin' } 
      });
    } else {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
