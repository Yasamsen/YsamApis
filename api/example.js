module.exports = {
  name: 'Example API',
  description: 'Simple endpoint untuk mengetes Yasam API.',
  method: 'GET',
  endpoint: '/api/example',
  parameters: {
    name: { type: 'string', required: false, description: 'Nama yang ingin disapa' }
  },
  example: {
    request: '/api/example?name=Yasam',
    response: { success: true, message: 'Hello, Yasam!' }
  },
  async handler(req, res) {
    const name = req.query.name || 'World';
    res.json({ success: true, message: `Hello, ${name}!`, timestamp: new Date().toISOString() });
  }
};
