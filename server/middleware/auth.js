/**
 * Firebase Auth Middleware
 * Verifies Firebase ID tokens for protected routes
 */

const { auth, mockData } = require('../services/firebase');

/**
 * Middleware to verify Firebase Authentication token
 * Falls back to mock mode if Firebase is not configured
 */
async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No authentication token provided' 
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // If Firebase Auth is configured, verify token
    if (auth) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email
        };
        return next();
      } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Invalid authentication token' 
        });
      }
    } else {
      // Mock mode - accept any token for development
      // In production, always use proper Firebase Auth
      if (token === 'dev-token' || token.length > 10) {
        req.user = {
          uid: 'dev-user',
          email: 'admin@ecom-shop.com'
        };
        console.log('⚠️ Mock auth mode - accepting token for development');
        return next();
      }
      
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid token in mock mode' 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Authentication check failed' 
    });
  }
}

/**
 * Optional auth middleware - continues even if not authenticated
 * Sets req.user if valid token provided
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      
      if (auth) {
        try {
          const decodedToken = await auth.verifyIdToken(token);
          req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email
          };
        } catch (error) {
          // Invalid token, but continue anyway
          req.user = null;
        }
      } else if (token === 'dev-token' || token.length > 10) {
        req.user = {
          uid: 'dev-user',
          email: 'admin@ecom-shop.com'
        };
      }
    }
    
    next();
  } catch (error) {
    next();
  }
}

module.exports = { verifyAuth, optionalAuth };
