const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'api');
const OUTPUT = path.join(__dirname, '..', 'public', 'api-manifest.json');

function walkDir(dir, base = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relative = path.join(base, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, relative));
    } else if (entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'index.js') {
      results.push({ fullPath, relative });
    }
  }

  return results;
}

function loadConfig(filePath) {
  try {
    // Clear cache so re-runs pick up changes
    delete require.cache[require.resolve(filePath)];
    const mod = require(filePath);

    if (mod && mod.config && typeof mod.config === 'object') {
      return mod.config;
    }

    // Fallback: if the module itself looks like config + handler
    if (mod && mod.name && mod.handler) {
      const { handler, ...config } = mod;
      return config;
    }

    return null;
  } catch (err) {
    console.warn(`Warning: could not load ${filePath}:`, err.message);
    return null;
  }
}

function main() {
  const files = walkDir(API_DIR);
  const manifest = [];

  for (const { fullPath, relative } of files) {
    const config = loadConfig(fullPath);
    if (!config) continue;

    // Ensure endpoint is set
    if (!config.endpoint) {
      const parts = relative.replace(/\\/g, '/').replace(/\.js$/, '');
      config.endpoint = '/api/' + parts;
    }

    // Ensure category from folder if missing
    if (!config.category) {
      const parts = relative.replace(/\\/g, '/').split('/');
      if (parts.length > 1) {
        config.category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      } else {
        config.category = 'General';
      }
    }

    // Normalize method
    config.method = (config.method || 'GET').toUpperCase();

    // Ensure parameters array
    if (!Array.isArray(config.parameters)) {
      config.parameters = [];
    }

    manifest.push({
      name: config.name || path.basename(relative, '.js'),
      description: config.description || '',
      method: config.method,
      endpoint: config.endpoint,
      category: config.category,
      parameters: config.parameters
    });
  }

  // Sort by category then name
  manifest.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  // Ensure public dir exists
  const publicDir = path.dirname(OUTPUT);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Generated ${OUTPUT} with ${manifest.length} API(s)`);
  manifest.forEach((m) => console.log(`  - [${m.category}] ${m.name} → ${m.endpoint}`));
}

main();
