const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configuration for user profile pictures
const userStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'website-app/users',
    format: async (req, file) => 'png',
    public_id: (req, file) => {
      return `user_${Date.now()}`;
    },
  },
});

// Storage configuration for prompt images
const promptStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'website-app/prompts',
    format: async (req, file) => 'png',
    public_id: (req, file) => {
      return `prompt_${Date.now()}_${Math.round(Math.random() * 1E9)}`;
    },
  },
});

const uploadUserProfile = multer({ 
  storage: userStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const uploadPromptImages = multer({ 
  storage: promptStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

module.exports = {
  cloudinary,
  uploadUserProfile,
  uploadPromptImages
};