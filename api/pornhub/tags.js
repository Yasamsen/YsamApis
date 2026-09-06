/**
 * Pornhub Tags
 * GET /api/pornhub/tags?letter=a
 */

const lib = require('./lib');

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const letter = ((req.query && req.query.letter) || 'a').toString().trim() || 'a';

  const data = await lib.getTags(letter);

  if (data && data.error) {
    return res.status(502).json({
      success: false,
      message: 'Upstream error',
      error: data.error
    });
  }

  return res.status(200).json({
    success: true,
    letter: letter.charAt(0).toLowerCase(),
    data
  });
}

handler.config = {
  name: 'Pornhub Tags',
  description: 'Get tags filtered by first letter (a–z).',
  method: 'GET',
  endpoint: '/api/pornhub/tags',
  category: 'Pornhub',
  parameters: [
    { name: 'letter', type: 'string', required: false, example: 'a' }
  ]
};

module.exports = handler;
