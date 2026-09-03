const fs = require('fs');
const path = require('path');

const apiDir = path.join(process.cwd(), 'api');
const out = path.join(process.cwd(), 'public', 'api-manifest.json');

function getMeta(file) {
  const source = fs.readFileSync(file, 'utf8');
  const name = source.match(/name:\s*["'`]([^"'`]+)["'`]/)?.[1];
  const description = source.match(/description:\s*["'`]([^"'`]+)["'`]/)?.[1];
  const method = source.match(/method:\s*["'`]([^"'`]+)["'`]/)?.[1] || 'GET';
  const endpoint = source.match(/endpoint:\s*["'`]([^"'`]+)["'`]/)?.[1];
  const category = source.match(/category:\s*["'`]([^"'`]+)["'`]/)?.[1] || (name?.toLowerCase().includes('search') ? 'Search' : name?.toLowerCase().includes('downloader') ? 'Downloader' : 'Other');
  const parametersBlock = source.match(/parameters:\s*\[([\s\S]*?)\]/)?.[1] || '';
  const parameters = [...parametersBlock.matchAll(/name:\s*["'`]([^"'`]+)["'`][\s\S]*?type:\s*["'`]([^"'`]+)["'`][\s\S]*?required:\s*(true|false)[\s\S]*?description:\s*["'`]([^"'`]+)["'`]/g)]
    .map(m => ({ name: m[1], type: m[2], required: m[3] === 'true', description: m[4] }));
  if (!name || !endpoint) return null;
  return { name, description: description || '', method, endpoint, category, parameters, file };
}

function collectJsFiles(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...collectJsFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'index.js') result.push(full);
  }
  return result;
}
const files = collectJsFiles(apiDir);
const apis = files.map(getMeta).filter(Boolean);
fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), apis }, null, 2));
console.log(`Generated ${apis.length} API entries -> public/api-manifest.json`);
