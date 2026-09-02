module.exports = {
  name: 'Instagram Downloader',
  description: 'Contoh endpoint Instagram Downloader. Ganti TODO dengan scraper milikmu.',
  method: 'GET', endpoint: '/api/instagram',
  parameters: { url: { type: 'string', required: true, description: 'URL Instagram' } },
  example: { request: '/api/instagram?url=https%3A%2F%2Fwww.instagram.com%2Freel%2Fexample%2F', response: { success: true, data: {} } },
  async handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: 'Parameter url diperlukan' });
    // TODO: pasang scraper Instagram di sini.
    res.json({ success: true, message: 'Endpoint Instagram aktif.', data: { input: url } });
  }
};
