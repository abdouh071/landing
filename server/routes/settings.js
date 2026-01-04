/**
 * Settings API Routes
 * Handle store settings
 */

const express = require('express');
const router = express.Router();
const { db, mockData, useMockMode } = require('../services/firebase');
const { verifyAuth } = require('../middleware/auth');

/**
 * GET /api/settings
 * Get store settings (public)
 */
router.get('/', async (req, res) => {
  try {
    if (!useMockMode && db) {
      const doc = await db.collection('settings').doc('main').get();
      if (!doc.exists) {
        // Return default settings
        return res.json({
          storeName: 'Ecom-Shop',
          storeNameFr: 'Ecom-Shop',
          outOfStockMessage: 'نفذت الكمية، سنتواصل معك قريبا عند توفره من جديد',
          outOfStockMessageFr: 'Rupture de stock, nous vous contacterون bientôt'
        });
      }
      return res.json(doc.data());
    } else {
      // Mock mode
      return res.json(mockData.settings.get('main'));
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/settings
 * Update store settings (auth required)
 */
router.put('/', verifyAuth, async (req, res) => {
  try {
    const { storeName, storeNameFr, outOfStockMessage, outOfStockMessageFr } = req.body;

    const updateData = {};
    if (storeName !== undefined) updateData.storeName = storeName;
    if (storeNameFr !== undefined) updateData.storeNameFr = storeNameFr;
    if (outOfStockMessage !== undefined) updateData.outOfStockMessage = outOfStockMessage;
    if (outOfStockMessageFr !== undefined) updateData.outOfStockMessageFr = outOfStockMessageFr;

    if (!useMockMode && db) {
      await db.collection('settings').doc('main').set(updateData, { merge: true });
      const doc = await db.collection('settings').doc('main').get();
      return res.json(doc.data());
    } else {
      // Mock mode
      const settings = mockData.settings.get('main');
      Object.assign(settings, updateData);
      return res.json(settings);
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
