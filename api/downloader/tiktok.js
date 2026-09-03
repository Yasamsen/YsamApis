// api/downloader/tiktok.js
//
// Every API route in SamApi follows the same shape: a plain metadata object
// (name, description, method, endpoint, category, parameters) plus the
// handler that serves the request. Vercel's Node runtime requires the
// default export of a file under /api to be a callable function, so the
// handler function itself is what we export - the metadata just rides along
// as a `.meta` property on that same function. scripts/generate-manifest.js
// reads `.meta` off every file at build time to produce api-manifest.json.
// Nothing about the metadata concept changes - only how it's attached.

const { fail } = require('../../lib/respond');

async function handler(req, res) {
  const { url } = req.query || {};

  if (!url) {
    return fail(res, 400, 'Parameter "url" diperlukan.');
  }

  // Scraper belum diimplementasikan. Jangan mengembalikan data palsu.
  return fail(res, 501, 'Endpoint belum dikonfigurasi.');
}

handler.meta = {
  name: 'TikTok Downloader',
  description: 'Download media dari TikTok berdasarkan URL video.',
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
