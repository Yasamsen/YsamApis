/**
 * TikTok Downloader
 * GET /api/downloader/tiktok
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

  // Implementation placeholder – ready for real scraper later
  return res.status(501).json({
    success: false,
    message: 'Endpoint belum dikonfigurasi.'
  });
}

handler.config = {
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
  ]
};

module.exports = handler;
