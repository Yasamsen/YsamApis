const { getIronSession } = require('iron-session');
const { serialize } = require('cookie');

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'samapi_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 14, // 14 days
    path: '/'
  }
};

async function getSession(req, res) {
  return getIronSession(req, res, sessionOptions);
}

function setSessionCookie(res, session) {
  // iron-session handles this internally when using getIronSession with res
}

module.exports = {
  getSession,
  sessionOptions
};
