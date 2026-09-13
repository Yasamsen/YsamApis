const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

// Login page — with IP auth, auto-redirect to dashboard if already identified
router.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect('/user/dashboard');
  }
  res.render('login', {
    title: 'Get Access — SamApi',
    user: null
  });
});

// Explicit "claim access" (forces session bind to current IP user)
router.get('/auth/ip', (req, res) => {
  // autoAuthByIp already ran; just go to dashboard
  if (req.user) {
    return res.redirect('/user/dashboard');
  }
  res.redirect('/');
});

// Logout — clear session only (IP user still exists in DB)
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

module.exports = router;
