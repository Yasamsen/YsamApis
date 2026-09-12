const User = require('../models/User');
const ApiLog = require('../models/ApiLog');

/**
 * Validate API key from URL path parameter
 * Expected path: /api/:category/:endpoint-key/:apiKey
 */
async function validateApiKey(req, res, next) {
  const startTime = Date.now();
  const apiKey = req.params.key || req.params.apiKey;

  if (!apiKey || !apiKey.startsWith('sk_')) {
    return res.status(401).json({
      status: false,
      message: 'Invalid or missing API key'
    });
  }

  try {
    const user = await User.findOne({ apiKey });

    if (!user) {
      return res.status(401).json({
        status: false,
        message: 'Invalid API key'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        status: false,
        message: 'Account is disabled or banned'
      });
    }

    // Check and reset daily limit
    user.checkAndResetLimit();

    if (!user.canMakeRequest()) {
      // Log the failed attempt
      await ApiLog.create({
        userId: user._id,
        apiKey: user.apiKey,
        endpoint: req.originalUrl.split('?')[0],
        method: req.method,
        statusCode: 429,
        responseTime: Date.now() - startTime,
        ip: req.ip || req.headers['x-forwarded-for'] || '',
        userAgent: req.headers['user-agent'] || '',
        success: false,
        errorMessage: 'Daily limit reached'
      }).catch(() => {});

      return res.status(429).json({
        status: false,
        message: 'Daily API limit reached',
        limit: user.dailyLimit,
        used: user.usedToday
      });
    }

    // Attach user and timing to request
    req.apiUser = user;
    req.apiStartTime = startTime;
    next();
  } catch (err) {
    console.error('[API Auth] Error:', err);
    return res.status(500).json({
      status: false,
      message: 'Internal server error during authentication'
    });
  }
}

/**
 * Log successful/failed API request after handler
 */
async function logApiRequest(req, res, result, statusCode = 200) {
  if (!req.apiUser) return;

  const responseTime = Date.now() - (req.apiStartTime || Date.now());

  try {
    await ApiLog.create({
      userId: req.apiUser._id,
      apiKey: req.apiUser.apiKey,
      endpoint: req.originalUrl.split('?')[0],
      method: req.method,
      statusCode,
      responseTime,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
      success: statusCode >= 200 && statusCode < 400,
      errorMessage: result && result.status === false ? (result.message || '') : ''
    });
  } catch (err) {
    console.error('[API Log] Failed to write log:', err.message);
  }
}

module.exports = {
  validateApiKey,
  logApiRequest
};
