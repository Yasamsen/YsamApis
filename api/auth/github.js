const { getSession } = require('../../lib/session');
const { findOrCreateUser } = require('../../lib/auth');

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
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
      return res.status(500).json({ success: false, message: 'GitHub OAuth is not configured' });
    }
    const redirectUri = `${BASE_URL}/api/auth/github`;
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'read:user user:email'
    });
    return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  }

  if (error) {
    return res.redirect('/login?error=oauth_denied');
  }

  try {
    const redirectUri = `${BASE_URL}/api/auth/github`;
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('GitHub token error', tokenData);
      return res.redirect('/login?error=token_failed');
    }

    const profileRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json'
      }
    });
    const profile = await profileRes.json();

    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/vnd.github+json'
        }
      });
      const emails = await emailsRes.json();
      if (Array.isArray(emails)) {
        const primary = emails.find((e) => e.primary) || emails[0];
        email = primary ? primary.email : null;
      }
    }

    const user = await findOrCreateUser({
      provider: 'github',
      providerId: String(profile.id),
      name: profile.name || profile.login,
      email,
      avatar: profile.avatar_url
    });

    const session = await getSession(req, res);
    session.userId = user._id.toString();
    await session.save();

    return res.redirect('/');
  } catch (err) {
    console.error('[auth/github]', err.message);
    return res.redirect('/login?error=server_error');
  }
};
