const { withUsageLimit } = require('../lib/api-handler');

const api = {
  name: 'Example API',
  description: 'Simple health-check endpoint to verify SamApi is working.',
  method: 'GET',
  endpoint: '/api/example',
  category: 'Tools',
  parameters: [],
  async handler(req, res) {
    return res.json({
      success: true,
      message: 'SamApi is working',
      data: {
        status: 'online',
        timestamp: new Date().toISOString()
      }
    });
  }
};

module.exports = withUsageLimit(api);
module.exports.meta = api;
