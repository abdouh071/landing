/**
 * ImgBB Image Upload Service
 * Handles image uploads to ImgBB API
 */

const fetch = require('node-fetch');
const FormData = require('form-data');
require('dotenv').config();

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

/**
 * Upload image to ImgBB
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} imageName - Optional image name
 * @returns {Promise<Object>} - Upload result with URL
 */
async function uploadImage(imageBuffer, imageName = 'image') {
  try {
    if (!IMGBB_API_KEY) {
      throw new Error('ImgBB API key not configured');
    }

    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');

    // Create form data for ImgBB API
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Image);
    formData.append('name', imageName);

    // Make upload request
    const response = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Upload failed');
    }

    console.log('✅ Image uploaded to ImgBB:', result.data.display_url);

    return {
      success: true,
      url: result.data.display_url,
      deleteUrl: result.data.delete_url,
      thumbnail: result.data.thumb?.url || result.data.display_url
    };
  } catch (error) {
    console.error('❌ ImgBB upload error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload image from URL to ImgBB
 * @param {string} imageUrl - Source image URL
 * @param {string} imageName - Optional image name
 * @returns {Promise<Object>} - Upload result with URL
 */
async function uploadImageFromUrl(imageUrl, imageName = 'image') {
  try {
    if (!IMGBB_API_KEY) {
      throw new Error('ImgBB API key not configured');
    }

    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', imageUrl);
    formData.append('name', imageName);

    const response = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || 'Upload failed');
    }

    return {
      success: true,
      url: result.data.display_url,
      deleteUrl: result.data.delete_url,
      thumbnail: result.data.thumb?.url || result.data.display_url
    };
  } catch (error) {
    console.error('❌ ImgBB URL upload error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { uploadImage, uploadImageFromUrl };
