const express = require('express');
const passport = require('passport');
const router = express.Router();
const { ensureGuest, ensureAuthenticated } = require('../middleware/auth');

// Login page
router.get('/login', ensureGuest, (req, res) => {
  res.render('login', {
    title: 'Login — SamApi',
    user: null
  });
});

// Google OAuth start
router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Google OAuth callback
router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login?error=auth_failed',
    session: true
  }),
  (req, res) => {
    // Successful authentication
    res.redirect('/dashboard');
  }
);

// Logout
router.get('/logout', ensureAuthenticated, (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
});

module.exports = router;
