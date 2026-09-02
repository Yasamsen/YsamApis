async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(200).json({
    success: true,
    message: 'SamApi is working',
    data: { status: 'online' }
  });
}
handler.api = {
  name: 'Example API',
  description: 'Simple health-check example endpoint.',
  method: 'GET',
  endpoint: '/api/example',
  parameters: []
};
module.exports = handler;
