const { getSession } = require('../../lib/session');
const { findOrCreateUser } = require('../../lib/auth');

const CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || (process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { code, error } = req.query || {};

  if (!code && !error) {
    if (!CLIENT_ID) {
      return res.status(500).json({ success: false, message: 'Facebook OAuth is not configured' });
    }
    const redirectUri = `${BASE_URL}/api/auth/facebook`;
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'email,public_profile',
      response_type: 'code'
    });
    return res.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params}`);
  }

  if (error) {
    return res.redirect('/login?error=oauth_denied');
  }

  try {
    const redirectUri = `${BASE_URL}/api/auth/facebook`;
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
        new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: redirectUri,
          code
        })
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Facebook token error', tokenData);
      return res.redirect('/login?error=token_failed');
    }

    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`
    );
    const profile = await profileRes.json();

    const user = await findOrCreateUser({
      provider: 'facebook',
      providerId: String(profile.id),
      name: profile.name,
      email: profile.email || null,
      avatar: profile.picture && profile.picture.data ? profile.picture.data.url : null
    });

    const session = await getSession(req, res);
    session.userId = user._id.toString();
    await session.save();

    return res.redirect('/');
  } catch (err) {
    console.error('[auth/facebook]', err.message);
    return res.redirect('/login?error=server_error');
  }
};
