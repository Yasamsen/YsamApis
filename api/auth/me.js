const { getSession } = require('../../lib/session');
const { getUserById, publicUser } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    if (!session.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      session.destroy();
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: publicUser(user)
    });
  } catch (err) {
    console.error('[auth/me]', err.message);
    return res.status(503).json({
      success: false,
      message: 'Database service temporarily unavailable.'
    });
  }
};
