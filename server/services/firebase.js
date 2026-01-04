/**
 * Firebase Admin SDK Service
 * Uses in-memory mock data when Firebase service account is not configured
 * Set FIREBASE_SERVICE_ACCOUNT_PATH in .env to use real Firebase
 */

require('dotenv').config();
const path = require('path');

// Flag to determine if we use mock mode
// Flag to determine if we use mock mode
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
const useMockMode = !serviceAccountPath && !serviceAccountEnv;

let admin = null;
let db = null;
let auth = null;

// Only initialize Firebase if we have a service account
if (!useMockMode) {
  try {
    admin = require('firebase-admin');
    
    let serviceAccount;
    // Check if we have the JSON string in env var (Best for Render/Railway)
    if (serviceAccountEnv) {
      try {
        serviceAccount = JSON.parse(serviceAccountEnv);
      } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT json', e);
      }
    } 
    // Fallback to file path (Best for local dev)
    else if (serviceAccountPath) {
      // Resolve path relative to project root
      const absolutePath = path.resolve(__dirname, '../../', serviceAccountPath.replace(/^\.\//, ''));
      serviceAccount = require(absolutePath);
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
      
      db = admin.firestore();
      auth = admin.auth();
      
      console.log('✅ Firebase Admin initialized');
    } else {
      throw new Error('No valid service account found');
    }
    
    // (Redundant lines removed)
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.log('⚠️  Falling back to mock mode');
  }
} else {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  📦 RUNNING IN MOCK MODE - Using in-memory storage     ║');
  console.log('║  To use Firebase, add service account to .env:         ║');
  console.log('║  FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json  ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
}

// In-memory storage for mock mode
const mockData = {
  products: new Map(),
  variants: new Map(),
  orders: new Map(),
  settings: new Map([
    ['main', {
      storeName: 'Ecom-Shop',
      storeNameFr: 'Ecom-Shop',
      outOfStockMessage: 'نفذت الكمية، سنتواصل معك قريبا عند توفره من جديد',
      outOfStockMessageFr: 'Rupture de stock, nous vous contacterons bientôt'
    }]
  ])
};

// Initialize demo product
mockData.products.set('product-1', {
  id: 'product-1',
  name: 'منتج رائع',
  nameFr: 'Produit Excellent',
  mainImage: 'https://via.placeholder.com/400x400/667eea/ffffff?text=Product',
  inStock: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Initialize demo variants
mockData.variants.set('variant-1', {
  id: 'variant-1',
  productId: 'product-1',
  name: 'اللون الأزرق',
  nameFr: 'Couleur Bleue',
  imageUrl: 'https://via.placeholder.com/150x150/3b82f6/ffffff?text=Blue',
  createdAt: new Date()
});
mockData.variants.set('variant-2', {
  id: 'variant-2',
  productId: 'product-1',
  name: 'اللون الأحمر',
  nameFr: 'Couleur Rouge',
  imageUrl: 'https://via.placeholder.com/150x150/ef4444/ffffff?text=Red',
  createdAt: new Date()
});
mockData.variants.set('variant-3', {
  id: 'variant-3',
  productId: 'product-1',
  name: 'اللون الأخضر',
  nameFr: 'Couleur Verte',
  imageUrl: 'https://via.placeholder.com/150x150/22c55e/ffffff?text=Green',
  createdAt: new Date()
});

module.exports = { admin, db, auth, mockData, useMockMode };
