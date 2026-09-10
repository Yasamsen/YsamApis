const { withUsageLimit } = require('../../lib/api-handler');

const api = {
  name: 'Example Search API',
  description: 'Example search endpoint for demonstration.',
  method: 'GET',
  endpoint: '/api/search/example',
  category: 'Search',
  parameters: [
    {
      name: 'query',
      type: 'string',
      required: true,
      example: 'samapi'
    },
    {
      name: 'limit',
      type: 'number',
      required: false,
      example: '10'
    }
  ],
  async handler(req, res) {
    const { query } = req.query || {};
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Parameter query diperlukan'
      });
    }
    return res.json({
      success: false,
      message: 'Endpoint belum dikonfigurasi.'
    });
  }
};

module.exports = withUsageLimit(api);
module.exports.meta = api;
