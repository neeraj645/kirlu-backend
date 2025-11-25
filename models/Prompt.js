const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide prompt name'],
    trim: true,
    maxlength: [100, 'Prompt name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide prompt description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  images: [{
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  },
  rating: {
    totalUsers: {
      type: Number,
      default: 0
    },
    avgRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot be more than 5']
    }
  },
  price: {
    regular: {
      type: Number,
      required: [true, 'Please provide regular price'],
      min: [0, 'Price cannot be negative']
    },
    offer: {
      type: Number,
      min: [0, 'Offer price cannot be negative'],
      validate: {
        validator: function(v) {
          return v <= this.price.regular;
        },
        message: 'Offer price cannot be greater than regular price'
      }
    }
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better search performance
promptSchema.index({ name: 'text', description: 'text' });
promptSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Prompt', promptSchema);