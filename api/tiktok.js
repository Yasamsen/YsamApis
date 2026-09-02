module.exports = {
  name: 'TikTok Downloader',
  description: 'Contoh endpoint TikTok Downloader. Ganti TODO dengan scraper milikmu.',
  method: 'GET', endpoint: '/api/tiktok',
  parameters: { url: { type: 'string', required: true, description: 'URL TikTok' } },
  example: { request: '/api/tiktok?url=https%3A%2F%2Fwww.tiktok.com%2F%40user%2Fvideo%2F123', response: { success: true, data: {} } },
  async handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: 'Parameter url diperlukan' });
    // TODO: pasang scraper TikTok di sini.
    res.json({ success: true, message: 'Endpoint TikTok aktif.', data: { input: url } });
  }
};
