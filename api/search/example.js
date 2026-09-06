/**
 * Example Search API
 * GET /api/search/example
 */

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const query = (req.query && req.query.query) || '';

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Parameter query diperlukan'
    });
  }

  // Demo response – replace with real search later
  return res.status(200).json({
    success: true,
    message: 'Search completed',
    data: {
      query,
      results: [
        { id: 1, title: `Result for "${query}"`, score: 0.95 },
        { id: 2, title: `Another match for "${query}"`, score: 0.82 }
      ],
      total: 2
    }
  });
}

handler.config = {
  name: 'Example Search API',
  description: 'Simple search endpoint for demonstration purposes.',
  method: 'GET',
  endpoint: '/api/search/example',
  category: 'Search',
  parameters: [
    {
      name: 'query',
      type: 'string',
      required: true,
      example: 'samapi'
    }
  ]
};

module.exports = handler;
