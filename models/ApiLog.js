const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  apiKey: {
    type: String,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    index: true
  },
  method: {
    type: String,
    default: 'GET'
  },
  statusCode: {
    type: Number,
    default: 200
  },
  responseTime: {
    type: Number,
    default: 0
  },
  ip: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for performance
apiLogSchema.index({ createdAt: -1 });
apiLogSchema.index({ userId: 1, createdAt: -1 });
apiLogSchema.index({ endpoint: 1, createdAt: -1 });

module.exports = mongoose.model('ApiLog', apiLogSchema);
