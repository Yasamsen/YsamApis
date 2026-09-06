/**
 * Pornhub Download URLs — disabled
 * Direct stream/download extraction is not provided.
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
      'Direct download / stream URLs tidak disediakan. Gunakan /api/pornhub/search atau /api/pornhub/video untuk metadata.'
  });
}

handler.config = {
  name: 'Pornhub Download URLs',
  description: 'Direct MP4/HLS download URLs — not available (copyright). Use search/video for metadata.',
  method: 'GET',
  endpoint: '/api/pornhub/download',
  category: 'Pornhub',
  parameters: [
    { name: 'id', type: 'string', required: true, example: 'ph5a1234567890a' }
  ]
};

module.exports = handler;
