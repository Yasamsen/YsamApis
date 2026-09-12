const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'api');
const MANIFEST_PATH = path.join(__dirname, '..', 'api-manifest.json');

let cachedManifest = null;

function scanDirectory(dir, base = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relative = path.join(base, item.name);

    if (item.isDirectory()) {
      results.push(...scanDirectory(fullPath, relative));
    } else if (item.isFile() && item.name.endsWith('.js') && !item.name.startsWith('_')) {
      results.push({
        filePath: fullPath,
        relativePath: relative.replace(/\\/g, '/'),
        category: base.split(/[/\\]/)[0] || 'general',
        name: item.name.replace(/\.js$/, '')
      });
    }
  }
  return results;
}

function loadEndpoint(fileInfo) {
  try {
    delete require.cache[require.resolve(fileInfo.filePath)];
    const mod = require(fileInfo.filePath);

    if (!mod || typeof mod.handler !== 'function') {
      return null;
    }

    const meta = mod.meta || {};
    const category = meta.category || fileInfo.category || 'general';
    const endpointName = meta.name || fileInfo.name;
    const slug = fileInfo.name;
    const endpointPath = `/api/${String(category).toLowerCase()}/${slug}-key/{key}`;

    return {
      id: `${String(category).toLowerCase()}/${slug}`,
      name: endpointName,
      description: meta.description || 'No description provided',
      category: category.charAt(0).toUpperCase() + category.slice(1),
      method: (meta.method || 'GET').toUpperCase(),
      endpoint: endpointPath,
      path: `/api/${String(category).toLowerCase()}/${slug}`,
      parameters: Array.isArray(meta.parameters) ? meta.parameters : [],
      responseExample: meta.responseExample || { status: true, creator: 'SamApi', result: {} },
      status: meta.status || 'online',
      featured: !!meta.featured,
      tags: meta.tags || [],
      file: fileInfo.relativePath
    };
  } catch (err) {
    console.error(`[Scanner] Error loading ${fileInfo.relativePath}:`, err.message);
    return null;
  }
}

function generateManifest() {
  const files = scanDirectory(API_DIR);
  const endpoints = [];

  for (const file of files) {
    const ep = loadEndpoint(file);
    if (ep) endpoints.push(ep);
  }

  endpoints.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  const categories = [...new Set(endpoints.map(e => e.category))].sort();
  const online = endpoints.filter(e => e.status === 'online').length;
  const maintenance = endpoints.filter(e => e.status === 'maintenance').length;
  const offline = endpoints.filter(e => e.status === 'offline').length;

  const manifest = {
    generatedAt: new Date().toISOString(),
    total: endpoints.length,
    online,
    maintenance,
    offline,
    categories,
    endpoints
  };

  cachedManifest = manifest;

  // Only write to disk outside Vercel (read-only filesystem on serverless)
  if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
    } catch (e) {
      console.warn('[Scanner] Could not write manifest file:', e.message);
    }
  }

  return manifest;
}

function getManifest() {
  if (cachedManifest) return cachedManifest;

  if (!process.env.VERCEL && fs.existsSync(MANIFEST_PATH)) {
    try {
      cachedManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      return cachedManifest;
    } catch (e) {
      // fall through
    }
  }

  return generateManifest();
}

function findEndpoint(category, slug) {
  const manifest = getManifest();
  const cat = String(category).toLowerCase();
  return manifest.endpoints.find(
    e => e.id === `${cat}/${slug}` || e.path === `/api/${cat}/${slug}`
  );
}

module.exports = {
  generateManifest,
  getManifest,
  findEndpoint,
  scanDirectory,
  loadEndpoint
};

if (require.main === module) {
  generateManifest();
}
