/**
 * Pornhub Categories
 * GET /api/pornhub/categories
 */

const lib = require('./lib');

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const data = await lib.getCategories();

  if (data && data.error) {
    return res.status(502).json({
      success: false,
      message: 'Upstream error',
      error: data.error
    });
  }

  return res.status(200).json({
    success: true,
    data
  });
}

handler.config = {
  name: 'Pornhub Categories',
  description: 'List all Pornhub categories from the public Webmasters API.',
  method: 'GET',
  endpoint: '/api/pornhub/categories',
  category: 'Pornhub',
  parameters: []
};

module.exports = handler;
