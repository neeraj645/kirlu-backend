const Prompt = require('../models/Prompt');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all prompts
// @route   GET /api/prompts
// @access  Public
exports.getAllPrompts = asyncHandler(async (req, res, next) => {
  // Filtering, sorting, pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  // Build query
  let query = { status: 'active' };
  
  // Search
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }
  
  // Price range
  if (req.query.minPrice || req.query.maxPrice) {
    query['price.regular'] = {};
    if (req.query.minPrice) {
      query['price.regular'].$gte = parseInt(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      query['price.regular'].$lte = parseInt(req.query.maxPrice);
    }
  }

  const prompts = await Prompt.find(query)
    .populate('createdBy', 'name profilePic')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const total = await Prompt.countDocuments(query);

  res.status(200).json({
    success: true,
    count: prompts.length,
    total,
    pagination: {
      page,
      pages: Math.ceil(total / limit)
    },
    data: prompts
  });
});

// @desc    Get single prompt
// @route   GET /api/prompts/:id
// @access  Public
exports.getPrompt = asyncHandler(async (req, res, next) => {
  const prompt = await Prompt.findById(req.params.id)
    .populate('createdBy', 'name profilePic');

  if (!prompt) {
    return next(new ErrorResponse('Prompt not found', 404));
  }

  res.status(200).json({
    success: true,
    data: prompt
  });
});

// @desc    Create new prompt
// @route   POST /api/prompts
// @access  Private
exports.createPrompt = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  // Handle images
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map(file => ({
      public_id: file.filename,
      url: file.path
    }));
  }

  const prompt = await Prompt.create(req.body);

  res.status(201).json({
    success: true,
    data: prompt
  });
});

// @desc    Update prompt
// @route   PUT /api/prompts/:id
// @access  Private
exports.updatePrompt = asyncHandler(async (req, res, next) => {
  let prompt = await Prompt.findById(req.params.id);

  if (!prompt) {
    return next(new ErrorResponse('Prompt not found', 404));
  }

  // Make sure user is prompt owner or admin
  if (prompt.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this prompt', 403));
  }

  // Handle new images
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map(file => ({
      public_id: file.filename,
      url: file.path
    }));
    req.body.images = [...prompt.images, ...newImages];
  }

  prompt = await Prompt.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: prompt
  });
});

// @desc    Delete prompt
// @route   DELETE /api/prompts/:id
// @access  Private
exports.deletePrompt = asyncHandler(async (req, res, next) => {
  const prompt = await Prompt.findById(req.params.id);

  if (!prompt) {
    return next(new ErrorResponse('Prompt not found', 404));
  }

  // Make sure user is prompt owner or admin
  if (prompt.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this prompt', 403));
  }

  // Delete images from Cloudinary
  for (let image of prompt.images) {
    await cloudinary.uploader.destroy(image.public_id);
  }

  await prompt.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Prompt deleted successfully'
  });
});

// @desc    Rate a prompt
// @route   POST /api/prompts/:id/rate
// @access  Private
exports.ratePrompt = asyncHandler(async (req, res, next) => {
  const { rating } = req.body;
  
  if (rating < 1 || rating > 5) {
    return next(new ErrorResponse('Rating must be between 1 and 5', 400));
  }

  const prompt = await Prompt.findById(req.params.id);

  if (!prompt) {
    return next(new ErrorResponse('Prompt not found', 404));
  }

  // Update rating
  const newTotalUsers = prompt.rating.totalUsers + 1;
  const newAvgRating = 
    (prompt.rating.avgRating * prompt.rating.totalUsers + rating) / newTotalUsers;

  prompt.rating = {
    totalUsers: newTotalUsers,
    avgRating: Math.round(newAvgRating * 10) / 10 // Round to 1 decimal
  };

  await prompt.save();

  res.status(200).json({
    success: true,
    data: prompt.rating
  });
});