module.exports = async function session(req, res) {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        authenticated: false,
      });
    }

    return res.json({
      success: true,
      authenticated: true,
      user: {
        role: req.session.user.role,
        label: req.session.user.label,
        loginAt: req.session.user.loginAt,
      },
    });
  } catch (err) {
    console.error('Session check error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
    });
  }
};
