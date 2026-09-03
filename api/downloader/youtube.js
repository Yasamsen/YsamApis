// api/downloader/youtube.js
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
  name: 'YouTube Downloader',
  description: 'Download media dari YouTube berdasarkan URL video.',
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
