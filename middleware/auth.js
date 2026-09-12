/**
 * Authentication & Authorization middleware
 */

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ status: false, message: 'Unauthorized. Please login.' });
  }
  return res.redirect('/login');
}

function ensureAdmin(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.role === 'admin') {
    return next();
  }
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(403).json({ status: false, message: 'Forbidden. Admin access required.' });
  }
  return res.status(403).render('errors/403', {
    title: 'Forbidden',
    message: 'You do not have permission to access this page.',
    user: req.user
  });
}

function ensureGuest(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  return next();
}

module.exports = {
  ensureAuthenticated,
  ensureAdmin,
  ensureGuest
};
