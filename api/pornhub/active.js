/**
 * Pornhub Video Active Check
 * GET /api/pornhub/active?id=...
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

  const id = ((req.query && (req.query.id || req.query.video_id)) || '').trim();
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Parameter id diperlukan'
    });
  }

  const data = await lib.isVideoActive(id);

  if (data && data.error && !('active' in data)) {
    return res.status(502).json({
      success: false,
      message: 'Upstream error',
      error: data.error
    });
  }

  return res.status(200).json({
    success: true,
    id,
    data
  });
}

handler.config = {
  name: 'Pornhub Video Active',
  description: 'Check if a video is still available / active.',
  method: 'GET',
  endpoint: '/api/pornhub/active',
  category: 'Pornhub',
  parameters: [
    { name: 'id', type: 'string', required: true, example: 'ph5a1234567890a' }
  ]
};

module.exports = handler;
