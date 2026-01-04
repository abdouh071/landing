/**
 * Variants API Routes
 * CRUD operations for product variants
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { db, mockData, useMockMode } = require('../services/firebase');
const { verifyAuth } = require('../middleware/auth');

/**
 * GET /api/variants/:productId
 * Get all variants for a product (public)
 */
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    if (!useMockMode && db) {
      const snapshot = await db.collection('variants')
        .where('productId', '==', productId)
        .get();
      const variants = [];
      snapshot.forEach(doc => {
        variants.push({ id: doc.id, ...doc.data() });
      });
      return res.json(variants);
    } else {
      // Mock mode
      const variants = Array.from(mockData.variants.values())
        .filter(v => v.productId === productId);
      return res.json(variants);
    }
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({ error: 'Failed to fetch variants' });
  }
});

/**
 * POST /api/variants
 * Add new variant (auth required)
 */
router.post('/',
  verifyAuth,
  [
    body('productId').trim().notEmpty().withMessage('Product ID is required'),
    body('name').trim().notEmpty().withMessage('Variant name is required'),
    body('nameFr').trim().notEmpty().withMessage('French variant name is required'),
    body('imageUrl').trim().notEmpty().withMessage('Image URL is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId, name, nameFr, imageUrl } = req.body;
      const now = new Date();

      const variantData = {
        productId,
        name,
        nameFr,
        imageUrl,
        createdAt: now
      };

      if (!useMockMode && db) {
        const docRef = await db.collection('variants').add(variantData);
        return res.status(201).json({ id: docRef.id, ...variantData });
      } else {
        // Mock mode
        const id = `variant-${Date.now()}`;
        const variant = { id, ...variantData };
        mockData.variants.set(id, variant);
        return res.status(201).json(variant);
      }
    } catch (error) {
      console.error('Error creating variant:', error);
      res.status(500).json({ error: 'Failed to create variant' });
    }
  }
);

/**
 * PUT /api/variants/:id
 * Update variant (auth required)
 */
router.put('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nameFr, imageUrl } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (nameFr !== undefined) updateData.nameFr = nameFr;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    if (!useMockMode && db) {
      await db.collection('variants').doc(id).update(updateData);
      const doc = await db.collection('variants').doc(id).get();
      return res.json({ id: doc.id, ...doc.data() });
    } else {
      // Mock mode
      const variant = mockData.variants.get(id);
      if (!variant) {
        return res.status(404).json({ error: 'Variant not found' });
      }
      Object.assign(variant, updateData);
      return res.json(variant);
    }
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({ error: 'Failed to update variant' });
  }
});

/**
 * DELETE /api/variants/:id
 * Delete variant (auth required)
 */
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!useMockMode && db) {
      await db.collection('variants').doc(id).delete();
    } else {
      // Mock mode
      mockData.variants.delete(id);
    }

    res.json({ success: true, message: 'Variant deleted' });
  } catch (error) {
    console.error('Error deleting variant:', error);
    res.status(500).json({ error: 'Failed to delete variant' });
  }
});

module.exports = router;
