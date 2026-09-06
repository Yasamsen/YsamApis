/**
 * Local development server for SamApi (Termux / Node)
 * Serves public/ static files + routes /api/* to serverless handlers
 *
 * Usage: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const API_DIR = path.join(__dirname, 'api');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

function serveStatic(reqPath, res) {
  // Clean path
  let filePath = reqPath === '/' ? '/index.html' : reqPath;

  // Pretty routes
  if (filePath === '/docs') filePath = '/docs.html';
  if (filePath === '/status') filePath = '/status.html';

  // Prevent path traversal
  const full = path.normalize(path.join(PUBLIC, filePath));
  if (!full.startsWith(PUBLIC)) {
    return send(res, 403, 'Forbidden');
  }

  fs.readFile(full, (err, data) => {
    if (err) {
      // 404 page
      const notFound = path.join(PUBLIC, '404.html');
      fs.readFile(notFound, (e2, html) => {
        if (e2) return send(res, 404, 'Not Found');
        send(res, 404, html, 'text/html; charset=utf-8');
      });
      return;
    }
    const ext = path.extname(full).toLowerCase();
    send(res, 200, data, MIME[ext] || 'application/octet-stream');
  });
}

async function handleApi(req, res, apiPath) {
  // apiPath e.g. /api/downloader/tiktok or /api/example
  const relative = apiPath.replace(/^\/api\/?/, ''); // downloader/tiktok
  let file = path.join(API_DIR, relative + '.js');

  // Try index.js in folder
  if (!fs.existsSync(file)) {
    const asIndex = path.join(API_DIR, relative, 'index.js');
    if (fs.existsSync(asIndex)) file = asIndex;
  }

  if (!fs.existsSync(file)) {
    return send(res, 404, JSON.stringify({ success: false, message: 'Endpoint not found' }), 'application/json');
  }

  try {
    // Clear cache so edits reload
    delete require.cache[require.resolve(file)];
    const handler = require(file);

    // Build mock Vercel-like req
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const query = {};
    urlObj.searchParams.forEach((v, k) => {
      query[k] = v;
    });

    // Collect body for POST
    let body = '';
    if (req.method === 'POST' || req.method === 'PUT') {
      body = await new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk) => { data += chunk; });
        req.on('end', () => resolve(data));
      });
    }

    const mockReq = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query,
      body: body ? (() => { try { return JSON.parse(body); } catch { return body; } })() : undefined
    };

    // Mock res compatible with our handlers
    const mockRes = {
      statusCode: 200,
      headers: {},
      setHeader(k, v) {
        this.headers[k] = v;
        return this;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(obj) {
        const payload = JSON.stringify(obj);
        res.writeHead(this.statusCode, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          ...this.headers
        });
        res.end(payload);
        return this;
      },
      end(data) {
        res.writeHead(this.statusCode, {
          'Access-Control-Allow-Origin': '*',
          ...this.headers
        });
        res.end(data);
        return this;
      }
    };

    await handler(mockReq, mockRes);
  } catch (err) {
    console.error('API error:', err);
    send(res, 500, JSON.stringify({ success: false, message: err.message || 'Internal Server Error' }), 'application/json');
  }
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  console.log(`${req.method} ${pathname}`);

  if (req.method === 'OPTIONS') {
    return send(res, 200, '');
  }

  if (pathname.startsWith('/api')) {
    return handleApi(req, res, pathname);
  }

  serveStatic(pathname, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  SamApi local server');
  console.log('  -------------------');
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://0.0.0.0:${PORT}`);
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
});
