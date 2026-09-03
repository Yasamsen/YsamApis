// api/example.js
// See api/downloader/tiktok.js for notes on the metadata + handler pattern.

const { ok } = require('../lib/respond');

async function handler(req, res) {
  return ok(res, { status: 'online' }, { message: 'SamApi is working' });
}

handler.meta = {
  name: 'Example API',
  description: 'Endpoint dasar untuk menguji apakah SamApi berjalan.',
  method: 'GET',
  endpoint: '/api/example',
  category: 'Other',
  parameters: []
};

module.exports = handler;
