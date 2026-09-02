async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  const url = req.query?.url;
  if (!url) return res.status(400).json({ success: false, message: 'Parameter url diperlukan' });
  return res.status(501).json({ success: false, message: 'Implementasi downloader belum dikonfigurasi.' });
}
handler.api = {
  name: 'Spotify Downloader',
  description: 'Download media from Spotify.',
  method: 'GET',
  endpoint: '/api/spotify',
  parameters: [
    { name: 'url', type: 'string', required: true, description: 'Spotify URL' }
  ]
};
module.exports = handler;
