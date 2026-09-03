// api/downloader/instagram.js
// See api/downloader/tiktok.js for notes on the metadata + handler pattern.

const { fail } = require('../../lib/respond');

async function handler(req, res) {
  const { url } = req.query || {};

  if (!url) {
    return fail(res, 400, 'Parameter "url" diperlukan.');
  }

  return fail(res, 501, 'Endpoint belum dikonfigurasi.');
}

handler.meta = {
  name: 'Instagram Downloader',
  description: 'Download media dari Instagram berdasarkan URL post atau reel.',
  method: 'GET',
  endpoint: '/api/downloader/instagram',
  category: 'Downloader',
  parameters: [
    {
      name: 'url',
      type: 'string',
      required: true,
      example: 'https://www.instagram.com/p/ABC123xyz/'
    }
  ]
};

module.exports = handler;
