async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  const url = req.query?.url;
  if (!url) return res.status(400).json({ success: false, message: 'Parameter url diperlukan' });
  return res.status(501).json({ success: false, message: 'Implementasi downloader belum dikonfigurasi.', input: url });
}
handler.api = {
  name: 'Example Downloader',
  description: 'Template endpoint untuk contoh API downloader.',
  method: 'GET',
  endpoint: '/api/downloader',
  category: 'Downloader',
  parameters: [
    { name: 'url', type: 'string', required: true, description: 'URL media yang ingin diproses' }
  ]
};
module.exports = handler;
