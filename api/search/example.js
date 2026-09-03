// api/search/example.js
// See api/downloader/tiktok.js for notes on the metadata + handler pattern.

const { ok, fail } = require('../../lib/respond');

async function handler(req, res) {
  const { query } = req.query || {};

  if (!query) {
    return fail(res, 400, 'Parameter "query" diperlukan.');
  }

  return ok(
    res,
    { query, results: [] },
    { message: 'Contoh API pencarian. Sumber data belum dikonfigurasi.' }
  );
}

handler.meta = {
  name: 'Example Search API',
  description: 'Contoh endpoint pencarian sederhana.',
  method: 'GET',
  endpoint: '/api/search/example',
  category: 'Search',
  parameters: [
    {
      name: 'query',
      type: 'string',
      required: true,
      example: 'contoh pencarian'
    }
  ]
};

module.exports = handler;
