module.exports = {
  name: 'YouTube Downloader',
  description: 'Contoh endpoint YouTube Downloader. Ganti TODO dengan scraper milikmu.',
  method: 'GET', endpoint: '/api/youtube',
  parameters: {
    url: { type: 'string', required: true, description: 'URL YouTube' },
    format: { type: 'string', required: false, description: 'Format media, misalnya mp4 atau mp3' }
  },
  example: { request: '/api/youtube?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dexample&format=mp4', response: { success: true, data: {} } },
  async handler(req, res) {
    const { url, format = 'mp4' } = req.query;
    if (!url) return res.status(400).json({ success: false, message: 'Parameter url diperlukan' });
    // TODO: pasang scraper YouTube di sini.
    res.json({ success: true, message: 'Endpoint YouTube aktif.', data: { input: url, format } });
  }
};
