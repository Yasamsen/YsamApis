const fs = require('fs');
const path = require('path');

function loadApis() {
  const apis = new Map();
  for (const file of fs.readdirSync(__dirname)) {
    if (!file.endsWith('.js') || file === 'index.js') continue;
    try {
      const api = require(path.join(__dirname, file));
      if (!api || !api.endpoint || typeof api.handler !== 'function') continue;
      const endpoint = api.endpoint.startsWith('/') ? api.endpoint : '/' + api.endpoint;
      apis.set(endpoint, { file, ...api, method: (api.method || 'GET').toUpperCase() });
    } catch (e) { console.error(`Failed loading ${file}:`, e); }
  }
  return apis;
}

module.exports = async (req, res) => {
  const apis = loadApis();
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  if (pathname === '/api' || pathname === '/api/') {
    return res.status(200).json({
      success: true, service: 'Yasam API', version: '1.0.0', status: 'online', total: apis.size,
      apis: [...apis.values()].map(({ handler, ...api }) => ({
        name: api.name || api.file.replace('.js',''),
        description: api.description || '', method: api.method,
        endpoint: api.endpoint, parameters: api.parameters || {}, example: api.example || null,
        url: `${url.origin}${api.endpoint}`
      }))
    });
  }

  if (pathname === '/api/health') {
    return res.status(200).json({ success: true, service: 'Yasam API', status: 'online', totalApi: apis.size, timestamp: new Date().toISOString() });
  }

  const api = apis.get(pathname);
  if (!api) return res.status(404).json({ success: false, message: 'Endpoint not found', endpoint: pathname });
  if (api.method !== req.method.toUpperCase()) {
    res.setHeader('Allow', api.method);
    return res.status(405).json({ success: false, message: 'Method not allowed', allowed: api.method });
  }
  try { return await api.handler(req, res); }
  catch (e) { console.error(e); return res.status(500).json({ success: false, message: 'Internal server error' }); }
};
