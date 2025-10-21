const mongoose = require('mongoose');

const terminalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  // Terminal layout configuration
  layout: [{
    id: String,
    component: String,
    x: Number,
    y: Number,
    w: Number,
    h: Number,
    config: mongoose.Schema.Types.Mixed
  }],
  // Calculation results and input data
  calculationResults: mongoose.Schema.Types.Mixed,
  inputData: mongoose.Schema.Types.Mixed,
  // Metadata
  ticker: {
    type: String,
    trim: true,
    uppercase: true
  },
  optionType: {
    type: String,
    enum: ['call', 'put', ''],
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
terminalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create index for faster queries
terminalSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Terminal', terminalSchema);

