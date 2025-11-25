const express = require('express');
const {
  getProfile,
  updateProfile,
  updateProfilePicture,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadUserProfile } = require('../config/cloudinary');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile-picture', uploadUserProfile.single('profilePic'), updateProfilePicture);

module.exports = router;