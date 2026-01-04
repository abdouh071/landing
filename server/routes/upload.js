/**
 * Upload API Routes
 * Handle image uploads to ImgBB
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage } = require('../services/imgbb');
const { verifyAuth } = require('../middleware/auth');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * POST /api/upload
 * Upload image to ImgBB (auth required)
 */
router.post('/', verifyAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageName = req.body.name || req.file.originalname || 'image';
    const result = await uploadImage(req.file.buffer, imageName);

    if (result.success) {
      return res.json({
        success: true,
        url: result.url,
        thumbnail: result.thumbnail,
        deleteUrl: result.deleteUrl
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: result.error || 'Upload failed' 
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/**
 * POST /api/upload/multiple
 * Upload multiple images to ImgBB (auth required)
 */
router.post('/multiple', verifyAuth, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const results = [];
    for (const file of req.files) {
      const result = await uploadImage(file.buffer, file.originalname);
      results.push({
        originalName: file.originalname,
        ...result
      });
    }

    return res.json({
      success: true,
      uploads: results
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

module.exports = router;
