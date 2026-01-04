/**
 * Products API Routes
 * CRUD operations for products
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { db, mockData, useMockMode } = require('../services/firebase');
const { verifyAuth } = require('../middleware/auth');

/**
 * GET /api/products
 * Get all products (public)
 */
router.get('/', async (req, res) => {
  try {
    if (!useMockMode && db) {
      const snapshot = await db.collection('products').get();
      const products = [];
      snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
      });
      return res.json(products);
    } else {
      // Mock mode
      const products = Array.from(mockData.products.values());
      return res.json(products);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * GET /api/products/:id
 * Get single product (public)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!useMockMode && db) {
      const doc = await db.collection('products').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.json({ id: doc.id, ...doc.data() });
    } else {
      // Mock mode
      const product = mockData.products.get(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.json(product);
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

/**
 * POST /api/products
 * Create new product (auth required)
 */
router.post('/', 
  verifyAuth,
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('nameFr').trim().notEmpty().withMessage('French product name is required'),
    body('price').optional().isNumeric().withMessage('Price must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, nameFr, price, mainImage = '', inStock = true } = req.body;
      const now = new Date();

      const productData = {
        name,
        nameFr,
        price: price ? parseFloat(price) : 0,
        mainImage,
        inStock,
        createdAt: now,
        updatedAt: now
      };

      if (!useMockMode && db) {
        const docRef = await db.collection('products').add(productData);
        return res.status(201).json({ id: docRef.id, ...productData });
      } else {
        // Mock mode
        const id = `product-${Date.now()}`;
        const product = { id, ...productData };
        mockData.products.set(id, product);
        return res.status(201).json(product);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

/**
 * PUT /api/products/:id
 * Update product (auth required)
 */
router.put('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nameFr, price, mainImage, inStock } = req.body;
    const now = new Date();

    const updateData = { updatedAt: now };
    if (name !== undefined) updateData.name = name;
    if (nameFr !== undefined) updateData.nameFr = nameFr;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (mainImage !== undefined) updateData.mainImage = mainImage;
    if (inStock !== undefined) updateData.inStock = inStock;

    if (!useMockMode && db) {
      await db.collection('products').doc(id).update(updateData);
      const doc = await db.collection('products').doc(id).get();
      return res.json({ id: doc.id, ...doc.data() });
    } else {
      // Mock mode
      const product = mockData.products.get(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      Object.assign(product, updateData);
      return res.json(product);
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/**
 * DELETE /api/products/:id
 * Delete product (auth required)
 */
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!useMockMode && db) {
      await db.collection('products').doc(id).delete();
      // Also delete associated variants
      const variantsSnapshot = await db.collection('variants')
        .where('productId', '==', id).get();
      const batch = db.batch();
      variantsSnapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } else {
      // Mock mode
      mockData.products.delete(id);
      // Delete associated variants
      for (const [variantId, variant] of mockData.variants) {
        if (variant.productId === id) {
          mockData.variants.delete(variantId);
        }
      }
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
