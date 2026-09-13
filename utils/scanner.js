const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'api');
const MANIFEST_PATH = path.join(__dirname, '..', 'api-manifest.json');

/**
 * Recursively scan API directory for endpoint files
 */
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

/**
 * Load and extract metadata from an endpoint module
 */
function loadEndpoint(fileInfo) {
  try {
    // Clear cache to allow hot-reload in development
    delete require.cache[require.resolve(fileInfo.filePath)];
    const mod = require(fileInfo.filePath);

    if (!mod || typeof mod.handler !== 'function') {
      console.warn(`[Scanner] Skipping ${fileInfo.relativePath}: no handler export`);
      return null;
    }

    const meta = mod.meta || {};
    const category = meta.category || fileInfo.category || 'general';
    const endpointName = meta.name || fileInfo.name;
    const slug = fileInfo.name;

    // Build canonical endpoint path with key placeholder
    const endpointPath = `/api/${category}/${slug}-key/{key}`;

    return {
      id: `${category}/${slug}`,
      name: endpointName,
      description: meta.description || 'No description provided',
      category: category.charAt(0).toUpperCase() + category.slice(1),
      method: (meta.method || 'GET').toUpperCase(),
      endpoint: endpointPath,
      path: `/api/${category}/${slug}`,
      parameters: Array.isArray(meta.parameters) ? meta.parameters : [],
      responseExample: meta.responseExample || { status: true, creator: 'SamApi', result: {} },
      status: meta.status || 'online', // online | offline | maintenance
      featured: !!meta.featured,
      tags: meta.tags || [],
      file: fileInfo.relativePath
    };
  } catch (err) {
    console.error(`[Scanner] Error loading ${fileInfo.relativePath}:`, err.message);
    return null;
  }
}

/**
 * Scan all endpoints and write manifest
 */
function generateManifest() {
  const files = scanDirectory(API_DIR);
  const endpoints = [];

  for (const file of files) {
    const ep = loadEndpoint(file);
    if (ep) endpoints.push(ep);
  }

  // Sort by category then name
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

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`[Scanner] Generated manifest with ${endpoints.length} endpoints`);
  return manifest;
}

/**
 * Get current manifest (load from file or generate)
 */
function getManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    } catch (e) {
      return generateManifest();
    }
  }
  return generateManifest();
}

/**
 * Find endpoint by path pattern
 */
function findEndpoint(category, slug) {
  const manifest = getManifest();
  return manifest.endpoints.find(
    e => e.id === `${category}/${slug}` || e.path === `/api/${category}/${slug}`
  );
}

module.exports = {
  generateManifest,
  getManifest,
  findEndpoint,
  scanDirectory,
  loadEndpoint
};

// Allow running as CLI
if (require.main === module) {
  generateManifest();
}
