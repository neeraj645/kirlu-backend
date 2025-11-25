const express = require('express');
const {
  getAllPrompts,
  getPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  ratePrompt,
} = require('../controllers/promptController');
const { protect, authorize } = require('../middleware/auth');
const { uploadPromptImages } = require('../config/cloudinary');

const router = express.Router();

router.get('/', getAllPrompts);
router.get('/:id', getPrompt);

router.use(protect);

router.post('/', uploadPromptImages.array('images', 10), createPrompt);
router.put('/:id', uploadPromptImages.array('images', 10), updatePrompt);
router.delete('/:id', deletePrompt);
router.post('/:id/rate', ratePrompt);

module.exports = router;