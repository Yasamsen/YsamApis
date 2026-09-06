/**
 * Pornhub Search
 * GET /api/pornhub/search?query=...
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

  const q = req.query || {};
  const query = (q.query || q.q || '').trim();
  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Parameter query diperlukan'
    });
  }

  const page = parseInt(q.page, 10) || 1;
  const ordering = q.ordering || 'newest';
  const period = q.period || 'alltime';
  const thumbsize = q.thumbsize || 'small';
  const category = q.category || undefined;

  const data = await lib.search({ query, page, ordering, period, thumbsize, category });

  if (data && data.error) {
    return res.status(502).json({
      success: false,
      message: 'Upstream error',
      error: data.error,
      detail: data.message || null
    });
  }

  return res.status(200).json({
    success: true,
    query,
    page,
    ordering,
    period,
    data
  });
}

handler.config = {
  name: 'Pornhub Search',
  description: 'Search videos on Pornhub via public Webmasters API.',
  method: 'GET',
  endpoint: '/api/pornhub/search',
  category: 'Pornhub',
  parameters: [
    { name: 'query', type: 'string', required: true, example: 'amateur' },
    { name: 'page', type: 'number', required: false, example: '1' },
    { name: 'ordering', type: 'string', required: false, example: 'mostviewed' },
    { name: 'period', type: 'string', required: false, example: 'weekly' },
    { name: 'thumbsize', type: 'string', required: false, example: 'small' },
    { name: 'category', type: 'string', required: false, example: '' }
  ]
};

module.exports = handler;
