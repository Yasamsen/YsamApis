/**
 * Authentication & Authorization middleware (IP-based)
 */

function ensureAuthenticated(req, res, next) {
  if (req.user && req.user.status === 'active') {
    return next();
  }
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(401).json({ status: false, message: 'Unauthorized.' });
  }
  return res.redirect('/');
}

function ensureAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(403).json({ status: false, message: 'Forbidden. Admin access required.' });
  }
  return res.status(403).render('errors/403', {
    title: 'Forbidden',
    message: 'You do not have permission to access this page.',
    user: req.user
  });
}

function ensureGuest(req, res, next) {
  if (req.user) {
    return res.redirect('/user/dashboard');
  }
  return next();
}

module.exports = {
  ensureAuthenticated,
  ensureAdmin,
  ensureGuest
};
