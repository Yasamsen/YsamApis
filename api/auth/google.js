const { getSession } = require('../../lib/session');
const { findOrCreateUser } = require('../../lib/auth');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || (process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { code, error } = req.query || {};

  // Start OAuth
  if (!code && !error) {
    if (!CLIENT_ID) {
      return res.status(500).json({ success: false, message: 'Google OAuth is not configured' });
    }
    const redirectUri = `${BASE_URL}/api/auth/google`;
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      prompt: 'select_account'
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  }

  if (error) {
    return res.redirect('/login?error=oauth_denied');
  }

  try {
    const redirectUri = `${BASE_URL}/api/auth/google`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Google token error', tokenData);
      return res.redirect('/login?error=token_failed');
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileRes.json();

    const user = await findOrCreateUser({
      provider: 'google',
      providerId: String(profile.id),
      name: profile.name,
      email: profile.email,
      avatar: profile.picture
    });

    const session = await getSession(req, res);
    session.userId = user._id.toString();
    await session.save();

    return res.redirect('/');
  } catch (err) {
    console.error('[auth/google]', err.message);
    return res.redirect('/login?error=server_error');
  }
};
