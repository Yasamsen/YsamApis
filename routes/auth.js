const express = require('express');
const passport = require('passport');
const router = express.Router();
const { ensureGuest, ensureAuthenticated } = require('../middleware/auth');

router.get('/login', ensureGuest, (req, res) => {
  res.render('login', {
    title: 'Login — SamApi',
    user: null
  });
});

router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get(
  '/auth/google/callback',
  (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      if (err) {
        console.error('[Auth Callback Error]', err);
        return res.redirect('/login?error=auth_failed');
      }
      if (!user) {
        console.error('[Auth Callback] No user', info);
        return res.redirect('/login?error=auth_failed');
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('[Auth Login Error]', loginErr);
          return res.redirect('/login?error=auth_failed');
        }
        return res.redirect('/user/dashboard');
      });
    })(req, res, next);
  }
);

router.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
});

module.exports = router;
