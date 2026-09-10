const { getSession } = require('../../lib/session');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const session = await getSession(req, res);
    session.destroy();
    return res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    return res.json({ success: true, message: 'Logged out' });
  }
};
