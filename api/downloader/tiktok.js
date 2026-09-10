const { withUsageLimit } = require('../../lib/api-handler');

const api = {
  name: 'TikTok Downloader',
  description: 'Download media from TikTok',
  method: 'GET',
  endpoint: '/api/downloader/tiktok',
  category: 'Downloader',
  parameters: [
    {
      name: 'url',
      type: 'string',
      required: true,
      example: 'https://www.tiktok.com/@user/video/1234567890'
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
