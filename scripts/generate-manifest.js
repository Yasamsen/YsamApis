// scripts/generate-manifest.js
//
// Walks the /api directory, requires every handler file, and reads its
// `.meta` property to build public/api-manifest.json at build time. This is
// the only place that "knows" about the api/ folder - the frontend never
// touches the filesystem, it just reads the generated JSON. Add a new file
// under api/<category>/<name>.js with a `.meta` object and it shows up
// everywhere automatically the next time this script runs.

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'api');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'api-manifest.json');

// Files that exist to serve a whole category (e.g. /api/downloader) rather
// than a single API. They still get their own metadata, but they're
// excluded from the "per-API" manifest used for cards, docs and stats.
const SKIP_FILENAMES = new Set(['index.js']);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files = files.concat(walk(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      if (SKIP_FILENAMES.has(entry.name)) continue;
      files.push(fullPath);
    }
  }

  return files;
}

function toManifestEntry(filePath) {
  // Clear the require cache so repeated runs (e.g. in a long-lived process)
  // always pick up the latest file contents.
  delete require.cache[require.resolve(filePath)];

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const mod = require(filePath);
  const meta = mod && mod.meta;

  if (!meta) {
    console.warn(`[generate-manifest] Skipped (no .meta export): ${filePath}`);
    return null;
  }

  const relative = path.relative(API_DIR, filePath);
  const parentFolder = path.dirname(relative).split(path.sep)[0];
  const category = meta.category || (parentFolder === '.' ? 'Other' : capitalize(parentFolder));

  return {
    name: meta.name || path.basename(filePath, '.js'),
    description: meta.description || '',
    method: (meta.method || 'GET').toUpperCase(),
    endpoint: meta.endpoint || `/api/${relative.replace(/\.js$/, '').split(path.sep).join('/')}`,
    category,
    parameters: Array.isArray(meta.parameters) ? meta.parameters : []
  };
}

function capitalize(str) {
  if (!str) return 'Other';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function main() {
  if (!fs.existsSync(API_DIR)) {
    console.error('[generate-manifest] api/ directory not found.');
    process.exit(1);
  }

  const files = walk(API_DIR);
  const manifest = files
    .map(toManifestEntry)
    .filter(Boolean)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`[generate-manifest] Wrote ${manifest.length} API(s) to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
}

main();
