// api/downloader/index.js
// Reachable at /api/downloader. Aggregates the metadata of every API in
// this category by requiring its siblings directly - no dependency on the
// generated manifest at runtime.

const { ok } = require('../../lib/respond');
const tiktok = require('./tiktok');
const youtube = require('./youtube');
const instagram = require('./instagram');

async function handler(req, res) {
  const apis = [tiktok, youtube, instagram].map((fn) => fn.meta);
  return ok(res, apis);
}

handler.meta = {
  name: 'Downloader Category',
  description: 'Daftar semua API downloader yang tersedia di SamApi.',
  method: 'GET',
  endpoint: '/api/downloader',
  category: 'Downloader',
  parameters: []
};

module.exports = handler;
