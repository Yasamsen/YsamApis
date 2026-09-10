#!/usr/bin/env node
/**
 * SamApi Manifest Generator
 * Scans api/ recursively and builds public/api-manifest.json
 * Does not execute handlers — extracts meta via static require of .meta or parses structure.
 */

const fs = require('fs');
const path = require('path');
const Module = require('module');

const API_DIR = path.join(__dirname, '..', 'api');
const OUT_FILE = path.join(__dirname, '..', 'public', 'api-manifest.json');

const REQUIRED_FIELDS = ['name', 'description', 'method', 'endpoint', 'category', 'parameters'];

function isApiFile(filePath) {
  const base = path.basename(filePath);
  if (!base.endsWith('.js')) return false;
  if (base.startsWith('_')) return false;
  if (base === 'index.js') return false;
  if (filePath.includes(`${path.sep}auth${path.sep}`)) return false;
  if (filePath.includes(`${path.sep}lib${path.sep}`)) return false;
  return true;
}

function walk(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, list);
    } else if (entry.isFile() && isApiFile(full)) {
      list.push(full);
    }
  }
  return list;
}

/**
 * Extract meta by temporarily stubbing heavy requires
 */
function loadMeta(filePath) {
  const originalRequire = Module.prototype.require;
  const stubs = {
    '../lib/api-handler': { withUsageLimit: (x) => x },
    '../../lib/api-handler': { withUsageLimit: (x) => x },
    '../lib/session': {},
    '../../lib/session': {},
    '../lib/auth': {},
    '../../lib/auth': {},
    '../lib/db': {},
    '../../lib/db': {},
    mongodb: { ObjectId: class {}, MongoClient: class {} },
    cookie: {},
    'iron-session': { getIronSession: async () => ({}) }
  };

  Module.prototype.require = function (id) {
    if (stubs[id]) return stubs[id];
    // relative lib paths
    if (id.includes('lib/api-handler')) return stubs['../lib/api-handler'];
    if (id.includes('lib/session')) return stubs['../lib/session'];
    if (id.includes('lib/auth')) return stubs['../lib/auth'];
    if (id.includes('lib/db')) return stubs['../lib/db'];
    return originalRequire.apply(this, arguments);
  };

  try {
    delete require.cache[require.resolve(filePath)];
    const mod = require(filePath);
    const meta = mod.meta || (mod.name ? mod : null);
    return meta;
  } finally {
    Module.prototype.require = originalRequire;
  }
}

function validate(meta) {
  for (const field of REQUIRED_FIELDS) {
    if (meta[field] === undefined || meta[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  if (!Array.isArray(meta.parameters)) {
    throw new Error('parameters must be an array');
  }
  if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(String(meta.method).toUpperCase())) {
    throw new Error(`Invalid method: ${meta.method}`);
  }
}

function main() {
  console.log('SamApi Manifest Generator\n');
  console.log('Scanning API directory...\n');

  if (!fs.existsSync(API_DIR)) {
    console.error('api/ directory not found');
    process.exit(1);
  }

  const files = walk(API_DIR);
  const apis = [];
  const categories = new Set();
  let failed = false;

  for (const file of files) {
    const rel = path.relative(API_DIR, file).replace(/\\/g, '/').replace(/\.js$/, '');
    try {
      const meta = loadMeta(file);
      if (!meta) throw new Error('No metadata found (export .meta or name fields)');
      validate(meta);

      const entry = {
        name: meta.name,
        description: meta.description,
        method: String(meta.method).toUpperCase(),
        endpoint: meta.endpoint,
        category: meta.category,
        parameters: meta.parameters.map((p) => ({
          name: p.name,
          type: p.type || 'string',
          required: !!p.required,
          example: p.example || ''
        }))
      };

      apis.push(entry);
      categories.add(entry.category);
      console.log(`✓ ${rel}`);
    } catch (err) {
      failed = true;
      console.error(`\nManifest generation failed:\n${rel}\n${err.message}\n`);
    }
  }

  if (failed) {
    process.exit(1);
  }

  apis.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(apis, null, 2));

  console.log('\nGenerated:');
  console.log('public/api-manifest.json');
  console.log(`\nTotal APIs: ${apis.length}`);
  console.log(`Categories: ${categories.size}`);
}

main();
