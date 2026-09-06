/**
 * Pornhub Streams — disabled
 * Stream URL scraping is not provided.
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

  return res.status(501).json({
    success: false,
    message:
      'Stream URLs tidak disediakan. Gunakan /api/pornhub/search atau /api/pornhub/video untuk metadata.'
  });
}

handler.config = {
  name: 'Pornhub Streams',
  description: 'HLS/MP4 stream URLs — not available (copyright). Use search/video for metadata.',
  method: 'GET',
  endpoint: '/api/pornhub/streams',
  category: 'Pornhub',
  parameters: [
    { name: 'id', type: 'string', required: true, example: 'ph5a1234567890a' }
  ]
};

module.exports = handler;
