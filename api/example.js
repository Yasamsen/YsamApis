/**
 * Example API endpoint
 * GET /api/example
 */

async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  return res.status(200).json({
    success: true,
    message: 'SamApi is working',
    data: {
      status: 'online',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  });
}

handler.config = {
  name: 'Example API',
  description: 'Simple health-check endpoint to verify SamApi is running.',
  method: 'GET',
  endpoint: '/api/example',
  category: 'General',
  parameters: []
};

module.exports = handler;
