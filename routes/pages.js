const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureGuest } = require('../middleware/auth');
const { getManifest, findEndpoint } = require('../utils/scanner');

// Home
router.get('/', (req, res) => {
  const manifest = getManifest();
  const featured = (manifest.endpoints || []).filter(e => e.featured).slice(0, 6);
  res.render('home', {
    title: 'SamApi — Powerful APIs for Developers',
    featured,
    stats: {
      total: manifest.total || 0,
      online: manifest.online || 0,
      maintenance: manifest.maintenance || 0,
      categories: (manifest.categories || []).length
    }
  });
});

// API Explorer
router.get('/explorer', (req, res) => {
  const manifest = getManifest();
  res.render('explorer', {
    title: 'API Explorer — SamApi',
    endpoints: manifest.endpoints || [],
    categories: manifest.categories || [],
    stats: {
      total: manifest.total || 0,
      online: manifest.online || 0
    }
  });
});

// Documentation index
router.get('/docs', (req, res) => {
  const manifest = getManifest();
  res.render('docs', {
    title: 'Documentation — SamApi',
    endpoints: manifest.endpoints || [],
    categories: manifest.categories || []
  });
});

// Single API docs / details
router.get('/docs/:category/:slug', (req, res) => {
  const { category, slug } = req.params;
  const ep = findEndpoint(category, slug);
  if (!ep) {
    return res.status(404).render('errors/404', {
      title: 'API Not Found',
      user: req.user
    });
  }
  res.render('api-detail', {
    title: `${ep.name} — SamApi Docs`,
    endpoint: ep
  });
});

// Privacy
router.get('/privacy', (req, res) => {
  res.render('privacy', { title: 'Privacy Policy — SamApi' });
});

// Terms
router.get('/terms', (req, res) => {
  res.render('terms', { title: 'Terms of Service — SamApi' });
});

// Try API playground (redirect to explorer if no id)
router.get('/try/:category/:slug', (req, res) => {
  const { category, slug } = req.params;
  const ep = findEndpoint(category, slug);
  if (!ep) {
    return res.status(404).render('errors/404', {
      title: 'API Not Found',
      user: req.user
    });
  }
  res.render('try', {
    title: `Try ${ep.name} — SamApi`,
    endpoint: ep
  });
});

module.exports = router;
