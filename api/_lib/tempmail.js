const https = require('https');
const http = require('http');

const BASE = 'https://cleantempmail.com';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const opts = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
        'Origin': BASE,
        'Referer': BASE + '/',
        ...options.headers,
      },
    };
    const req = mod.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function getDomains() {
  return request(`${BASE}/api/domains?limit=2000`);
}

async function generateEmail() {
  return request(`${BASE}/api/generate-email`);
}

async function customEmail(prefix, domain) {
  return request(`${BASE}/api/generate-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { prefix, domain },
  });
}

async function getInbox(email) {
  return request(`${BASE}/api/emails?email=${encodeURIComponent(email)}`);
}

module.exports = { getDomains, generateEmail, customEmail, getInbox };