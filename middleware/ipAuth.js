const User = require('../models/User');

/**
 * Auto-login / create user based on client IP.
 * Attaches req.user and keeps session in sync.
 */
async function autoAuthByIp(req, res, next) {
  try {
    // Skip for static assets / API key routes that don't need session user
    if (req.path.startsWith('/css') || req.path.startsWith('/js') || req.path.startsWith('/assets')) {
      return next();
    }

    const ip = User.getClientIp(req);
    const adminIps = (process.env.ADMIN_IPS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // If already logged in via session and same IP, keep it
    if (req.session && req.session.userId) {
      const existing = await User.findById(req.session.userId);
      if (existing && existing.status === 'active') {
        // Re-check admin by IP in case ADMIN_IPS changed
        if (adminIps.includes(ip) && existing.role !== 'admin') {
          existing.role = 'admin';
          existing.unlimited = true;
          existing.dailyLimit = 999999;
          await existing.save();
        }
        req.user = existing;
        return next();
      }
    }

    // Find or create by IP
    let user = await User.findOne({ ip });

    if (!user) {
      const isAdmin = adminIps.includes(ip);
      const shortId = ip.replace(/[.:]/g, '').slice(-6) || 'guest';
      user = await User.create({
        ip,
        name: `User-${shortId}`,
        displayId: shortId,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent('U' + shortId)}&background=6366f1&color=fff`,
        role: isAdmin ? 'admin' : 'user',
        unlimited: isAdmin,
        dailyLimit: isAdmin ? 999999 : 10,
        apiKey: User.generateApiKey(),
        usedToday: 0,
        totalRequests: 0,
        status: 'active',
        lastReset: new Date()
      });
    } else {
      // Ensure API key exists
      if (!user.apiKey) {
        user.apiKey = User.generateApiKey();
      }
      // Promote to admin if IP is in ADMIN_IPS
      if (adminIps.includes(ip)) {
        user.role = 'admin';
        user.unlimited = true;
        user.dailyLimit = 999999;
      }
      await user.save();
    }

    req.user = user;
    if (req.session) {
      req.session.userId = user._id.toString();
    }
    next();
  } catch (err) {
    console.error('[IP Auth]', err);
    next();
  }
}

module.exports = { autoAuthByIp };
