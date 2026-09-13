const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Identified by IP (hashed for privacy in some cases, but we store plain for lookup)
  ip: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    default: 'Guest'
  },
  // Optional display label
  displayId: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  apiKey: {
    type: String,
    unique: true,
    index: true
  },
  dailyLimit: {
    type: Number,
    default: 10
  },
  usedToday: {
    type: Number,
    default: 0
  },
  lastReset: {
    type: Date,
    default: Date.now
  },
  totalRequests: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'disabled', 'banned'],
    default: 'active'
  },
  unlimited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.statics.generateApiKey = function () {
  const prefix = 'sk_';
  const random = crypto.randomBytes(12).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 14);
  return prefix + random;
};

userSchema.statics.getClientIp = function (req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return (
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  ).replace(/^::ffff:/, '');
};

userSchema.methods.checkAndResetLimit = function () {
  const now = new Date();
  const last = new Date(this.lastReset);
  const isNewDay =
    now.getUTCFullYear() !== last.getUTCFullYear() ||
    now.getUTCMonth() !== last.getUTCMonth() ||
    now.getUTCDate() !== last.getUTCDate();

  if (isNewDay) {
    this.usedToday = 0;
    this.lastReset = now;
  }
  return this;
};

userSchema.methods.canMakeRequest = function () {
  this.checkAndResetLimit();
  if (this.unlimited || this.role === 'admin') return true;
  return this.usedToday < this.dailyLimit;
};

userSchema.methods.incrementUsage = async function () {
  this.checkAndResetLimit();
  this.usedToday += 1;
  this.totalRequests += 1;
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
