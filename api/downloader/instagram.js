/**
 * Instagram Downloader
 * GET /api/downloader/instagram
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
  ]
};

module.exports = handler;
