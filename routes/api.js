const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { validateApiKey, logApiRequest } = require('../middleware/apiAuth');
const { getManifest, findEndpoint } = require('../utils/scanner');

/**
 * Dynamic API handler
 * Pattern: /api/:category/:endpointName-key/:key
 * Example: /api/downloader/tiktok-key/sk_xxxxx?url=...
 */
router.all('/:category/:endpointKey/:key', validateApiKey, async (req, res) => {
  const { category, endpointKey, key } = req.params;
  const startTime = req.apiStartTime || Date.now();

  // Extract slug from "tiktok-key" → "tiktok"
  const slug = endpointKey.replace(/-key$/, '');
  if (!slug || endpointKey === slug) {
    return res.status(404).json({
      status: false,
      message: 'Invalid endpoint format. Use /api/{category}/{name}-key/{apiKey}'
    });
  }

  try {
    const filePath = path.join(__dirname, '..', 'api', category, `${slug}.js`);

    if (!fs.existsSync(filePath)) {
      await logApiRequest(req, res, { status: false, message: 'Endpoint not found' }, 404);
      return res.status(404).json({
        status: false,
        message: `Endpoint not found: /api/${category}/${slug}`
      });
    }

    // Clear require cache for development hot-reload
    delete require.cache[require.resolve(filePath)];
    const endpointModule = require(filePath);

    if (!endpointModule || typeof endpointModule.handler !== 'function') {
      await logApiRequest(req, res, { status: false, message: 'Invalid endpoint handler' }, 500);
      return res.status(500).json({
        status: false,
        message: 'Endpoint handler is invalid'
      });
    }

    // Check endpoint status from meta
    const status = (endpointModule.meta && endpointModule.meta.status) || 'online';
    if (status === 'offline') {
      await logApiRequest(req, res, { status: false, message: 'Endpoint offline' }, 503);
      return res.status(503).json({
        status: false,
        message: 'This API endpoint is currently offline'
      });
    }
    if (status === 'maintenance') {
      await logApiRequest(req, res, { status: false, message: 'Endpoint under maintenance' }, 503);
      return res.status(503).json({
        status: false,
        message: 'This API endpoint is under maintenance'
      });
    }

    // Collect parameters from query and body
    const params = { ...req.query, ...req.body };

    // Execute handler
    const result = await endpointModule.handler(params, req);

    // Increment usage only on success (or always? Spec says after validation)
    // We already passed limit check, so increment
    await req.apiUser.incrementUsage();

    const statusCode = result && result.status === false ? 400 : 200;
    await logApiRequest(req, res, result, statusCode);

    return res.status(statusCode).json(result);
  } catch (err) {
    console.error(`[API] Error executing ${category}/${slug}:`, err);
    await logApiRequest(req, res, { status: false, message: err.message }, 500);
    return res.status(500).json({
      status: false,
      message: 'Internal server error while processing request'
    });
  }
});

/**
 * Public manifest endpoint
 */
router.get('/manifest', (req, res) => {
  try {
    const manifest = getManifest();
    res.json(manifest);
  } catch (err) {
    res.status(500).json({ status: false, message: 'Failed to load manifest' });
  }
});

/**
 * Health / status
 */
router.get('/status', (req, res) => {
  const manifest = getManifest();
  res.json({
    status: true,
    creator: 'SamApi',
    total: manifest.total,
    online: manifest.online,
    maintenance: manifest.maintenance,
    offline: manifest.offline,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
