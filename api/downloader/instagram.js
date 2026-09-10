const { withUsageLimit } = require('../../lib/api-handler');

const api = {
  name: 'Instagram Downloader',
  description: 'Download media from Instagram',
  method: 'GET',
  endpoint: '/api/downloader/instagram',
  category: 'Downloader',
  parameters: [
    {
      name: 'url',
      type: 'string',
      required: true,
      example: 'https://www.instagram.com/p/ABC123/'
    }
  ],
  async handler(req, res) {
    const { url } = req.query || {};
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Parameter url diperlukan'
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
