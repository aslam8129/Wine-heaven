const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Fixed typo here
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
      folder: 'product_images',
      allowed_formats: ['jpeg', 'png', 'jpg'],
      transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

const upload = multer({
  storage,
  limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB per file
      fields: 10, // Maximum number of fields
      fieldSize: 10 * 1024 * 1024, // Limit for field value size
  }
}).single('image'); // Changed to .single() to match form field

module.exports = { cloudinary, upload };
