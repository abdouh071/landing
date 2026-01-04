/**
 * Orders API Routes
 * Handle order submissions and viewing
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { db, mockData, useMockMode } = require('../services/firebase');
const { verifyAuth } = require('../middleware/auth');

/**
 * GET /api/orders
 * Get all orders (auth required)
 */
router.get('/', verifyAuth, async (req, res) => {
  try {
    if (!useMockMode && db) {
      const snapshot = await db.collection('orders')
        .orderBy('createdAt', 'desc')
        .get();
      const orders = [];
      snapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      return res.json(orders);
    } else {
      // Mock mode
      const orders = Array.from(mockData.orders.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(orders);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * POST /api/orders
 * Submit new order (public)
 */
router.post('/',
  [
    body('firstName').trim().notEmpty().withMessage('الاسم الأول مطلوب'),
    body('lastName').trim().notEmpty().withMessage('اسم العائلة مطلوب'),
    body('phone').trim().notEmpty().withMessage('رقم الهاتف مطلوب')
      .matches(/^[0-9+\s-]{8,15}$/).withMessage('رقم الهاتف غير صالح'),
    body('state').trim().notEmpty().withMessage('الولاية مطلوبة'),
    body('municipality').trim().notEmpty().withMessage('البلدية مطلوبة'),
    body('address').trim().notEmpty().withMessage('العنوان مطلوب'),
    body('productId').trim().notEmpty().withMessage('معرف المنتج مطلوب'),
    body('variantId').trim().notEmpty().withMessage('يجب اختيار نوع المنتج')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        firstName, 
        lastName, 
        phone, 
        state, 
        municipality, 
        address, 
        productId, 
        variantId,
        variantImage,
        variantName
      } = req.body;
      
      const now = new Date();

      const orderData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        state: state.trim(),
        municipality: municipality.trim(),
        address: address.trim(),
        productId,
        variantId,
        variantImage: variantImage || '',
        variantName: variantName || '',
        status: 'pending',
        createdAt: now
      };

      if (!useMockMode && db) {
        const docRef = await db.collection('orders').add(orderData);
        console.log('✅ Order created:', docRef.id);
        return res.status(201).json({ 
          success: true, 
          id: docRef.id,
          message: 'نفذت الكمية، سنتواصل معك قريبا عند توفره من جديد'
        });
      } else {
        // Mock mode
        const id = `order-${Date.now()}`;
        const order = { id, ...orderData };
        mockData.orders.set(id, order);
        console.log('✅ Mock order created:', id);
        return res.status(201).json({ 
          success: true, 
          id,
          message: 'نفذت الكمية، سنتواصل معك قريبا عند توفره من جديد'
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  }
);

/**
 * PUT /api/orders/:id/status
 * Update order status (auth required)
 */
router.put('/:id/status', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'processed', 'shipped', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (!useMockMode && db) {
      await db.collection('orders').doc(id).update({ status });
      const doc = await db.collection('orders').doc(id).get();
      return res.json({ id: doc.id, ...doc.data() });
    } else {
      // Mock mode
      const order = mockData.orders.get(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      order.status = status;
      return res.json(order);
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

/**
 * DELETE /api/orders/:id
 * Delete order (auth required)
 */
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!useMockMode && db) {
      await db.collection('orders').doc(id).delete();
    } else {
      // Mock mode
      mockData.orders.delete(id);
    }

    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;
