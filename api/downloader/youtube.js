const { withUsageLimit } = require('../../lib/api-handler');

const api = {
  name: 'YouTube Downloader',
  description: 'Download media from YouTube',
  method: 'GET',
  endpoint: '/api/downloader/youtube',
  category: 'Downloader',
  parameters: [
    {
      name: 'url',
      type: 'string',
      required: true,
      example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      name: 'quality',
      type: 'string',
      required: false,
      example: '720p'
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
