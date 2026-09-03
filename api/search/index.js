async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  const q = req.query?.q;
  if (!q) return res.status(400).json({ success: false, message: 'Parameter q diperlukan' });
  return res.status(501).json({ success: false, message: 'Implementasi search belum dikonfigurasi.', query: q });
}
handler.api = {
  name: 'Search API',
  description: 'Example endpoint for search requests.',
  method: 'GET',
  endpoint: '/api/search',
  category: 'Search',
  parameters: [
    { name: 'q', type: 'string', required: true, description: 'Kata kunci pencarian' }
  ]
};
module.exports = handler;
