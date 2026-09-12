const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ApiLog = require('../models/ApiLog');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const { getManifest, generateManifest } = require('../utils/scanner');

router.use(ensureAuthenticated, ensureAdmin);

// Admin Dashboard
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      requestsToday,
      requestsMonth,
      recentLogs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      ApiLog.countDocuments({ createdAt: { $gte: today } }),
      ApiLog.countDocuments({ createdAt: { $gte: monthStart } }),
      ApiLog.find().sort({ createdAt: -1 }).limit(15).populate('userId', 'name email avatar').lean()
    ]);

    const manifest = getManifest();

    // Simple daily stats for last 7 days
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const next = new Date(d);
      next.setUTCDate(next.getUTCDate() + 1);
      const count = await ApiLog.countDocuments({ createdAt: { $gte: d, $lt: next } });
      dailyStats.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en', { weekday: 'short' }),
        count
      });
    }

    res.render('admin/dashboard', {
      title: 'Admin Dashboard — SamApi',
      stats: {
        totalUsers,
        activeUsers,
        totalApis: manifest.total,
        onlineApis: manifest.online,
        requestsToday,
        requestsMonth
      },
      dailyStats,
      recentLogs,
      page: 'admin-dashboard'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/500', { title: 'Error', message: err.message, user: req.user });
  }
});

// User Management
router.get('/users', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const filter = q
      ? {
          $or: [
            { name: new RegExp(q, 'i') },
            { email: new RegExp(q, 'i') }
          ]
        }
      : {};

    const users = await User.find(filter).sort({ createdAt: -1 }).limit(100).lean();

    res.render('admin/users', {
      title: 'User Management — SamApi',
      users,
      query: q,
      page: 'admin-users'
    });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Error', message: err.message, user: req.user });
  }
});

// Update user (limit, status, role)
router.post('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: false, message: 'User not found' });

    const { dailyLimit, status, action } = req.body;

    if (action === 'regenerate-key') {
      user.apiKey = User.generateApiKey();
    }
    if (dailyLimit !== undefined && !isNaN(dailyLimit)) {
      user.dailyLimit = Math.max(0, parseInt(dailyLimit));
      if (user.role === 'admin') user.unlimited = true;
    }
    if (status && ['active', 'disabled', 'banned'].includes(status)) {
      user.status = status;
    }

    await user.save();

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ status: true, user: { id: user._id, apiKey: user.apiKey, status: user.status, dailyLimit: user.dailyLimit } });
    }
    res.redirect('/admin/users');
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

// API Management
router.get('/apis', (req, res) => {
  const manifest = getManifest();
  res.render('admin/apis', {
    title: 'API Management — SamApi',
    endpoints: manifest.endpoints || [],
    categories: manifest.categories || [],
    page: 'admin-apis'
  });
});

// Reload manifest
router.post('/apis/reload', (req, res) => {
  try {
    const manifest = generateManifest();
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ status: true, total: manifest.total });
    }
    res.redirect('/admin/apis?reloaded=1');
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

// Logs
router.get('/logs', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ApiLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email avatar')
        .lean(),
      ApiLog.countDocuments()
    ]);

    res.render('admin/logs', {
      title: 'API Logs — SamApi',
      logs,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        totalItems: total
      },
      page: 'admin-logs'
    });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Error', message: err.message, user: req.user });
  }
});

// Stats / Usage
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const topEndpoints = await ApiLog.aggregate([
      { $group: { _id: '$endpoint', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const topUsers = await ApiLog.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Populate user names
    const userIds = topUsers.map(u => u._id).filter(Boolean);
    const usersMap = {};
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
    users.forEach(u => { usersMap[u._id.toString()] = u; });

    const topUsersDetailed = topUsers.map(u => ({
      ...u,
      user: usersMap[u._id?.toString()] || null
    }));

    res.render('admin/stats', {
      title: 'Usage Statistics — SamApi',
      topEndpoints,
      topUsers: topUsersDetailed,
      page: 'admin-stats'
    });
  } catch (err) {
    res.status(500).render('errors/500', { title: 'Error', message: err.message, user: req.user });
  }
});

// System settings (placeholder)
router.get('/settings', (req, res) => {
  res.render('admin/settings', {
    title: 'System Settings — SamApi',
    page: 'admin-settings'
  });
});

module.exports = router;
