/**
 * YouTube Downloader
 * GET /api/downloader/youtube
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

  const url = (req.query && req.query.url) || '';

  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'Parameter url diperlukan'
    });
  }

  return res.status(501).json({
    success: false,
    message: 'Endpoint belum dikonfigurasi.'
  });
}

handler.config = {
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
    }
  ]
};

module.exports = handler;
