const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const ApiLog = require('../models/ApiLog');

// Dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.checkAndResetLimit();
    await user.save();

    const recentLogs = await ApiLog.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.render('dashboard', {
      title: 'Dashboard — SamApi',
      user,
      recentLogs
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/500', { title: 'Error', message: 'Failed to load dashboard', user: req.user });
  }
});

// Account / Profile
router.get('/account', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.checkAndResetLimit();
    await user.save();
    res.render('account', {
      title: 'Account — SamApi',
      user
    });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Error', message: err.message, user: req.user });
  }
});

// API Key management
router.get('/api-key', ensureAuthenticated, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.render('api-key', {
    title: 'API Key — SamApi',
    user
  });
});

// Regenerate API key
router.post('/api-key/regenerate', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.apiKey = User.generateApiKey();
    await user.save();

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ status: true, apiKey: user.apiKey });
    }
    res.redirect('/user/api-key?regenerated=1');
  } catch (err) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ status: false, message: err.message });
    }
    res.redirect('/user/api-key?error=1');
  }
});

// Usage
router.get('/usage', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.checkAndResetLimit();
    await user.save();

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const logsToday = await ApiLog.find({
      userId: user._id,
      createdAt: { $gte: todayStart }
    }).sort({ createdAt: -1 }).limit(50).lean();

    const totalLogs = await ApiLog.countDocuments({ userId: user._id });

    res.render('usage', {
      title: 'API Usage — SamApi',
      user,
      logsToday,
      totalLogs
    });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Error', message: err.message, user: req.user });
  }
});

// Request History
router.get('/history', ensureAuthenticated, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ApiLog.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ApiLog.countDocuments({ userId: req.user._id })
    ]);

    res.render('history', {
      title: 'Request History — SamApi',
      user: req.user,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Error', message: err.message, user: req.user });
  }
});

// Settings
router.get('/settings', ensureAuthenticated, (req, res) => {
  res.render('settings', {
    title: 'Settings — SamApi',
    user: req.user
  });
});

// Profile redirect
router.get('/profile', ensureAuthenticated, (req, res) => {
  res.redirect('/user/account');
});

module.exports = router;
