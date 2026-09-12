const { authenticateKey } = require('../../lib/auth');

module.exports = async function login(req, res) {
  try {
    const { accessKey } = req.body;

    if (!accessKey || typeof accessKey !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Access key is required',
      });
    }

    const result = await authenticateKey(accessKey);

    if (!result) {
      // Generic error - do not reveal whether key is admin or user
      return res.status(401).json({
        success: false,
        error: 'Invalid Access Key',
        message: 'The access key you entered is invalid or has expired',
      });
    }

    // Create session
    req.session.user = {
      role: result.role,
      keyId: result.keyId,
      label: result.label,
      loginAt: new Date().toISOString(),
    };

    // Force save session
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return res.json({
      success: true,
      role: result.role,
      label: result.label,
      redirect: result.role === 'admin' ? '/admin' : '/storage',
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Login failed. Please try again.',
    });
  }
};
