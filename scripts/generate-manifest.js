const fs = require('fs');
const path = require('path');

const apiDir = path.join(process.cwd(), 'api');
const out = path.join(process.cwd(), 'public', 'api-manifest.json');

function getMeta(file) {
  const source = fs.readFileSync(path.join(apiDir, file), 'utf8');
  const name = source.match(/name:\s*["'`]([^"'`]+)["'`]/)?.[1];
  const description = source.match(/description:\s*["'`]([^"'`]+)["'`]/)?.[1];
  const method = source.match(/method:\s*["'`]([^"'`]+)["'`]/)?.[1] || 'GET';
  const endpoint = source.match(/endpoint:\s*["'`]([^"'`]+)["'`]/)?.[1];
  const parametersBlock = source.match(/parameters:\s*\[([\s\S]*?)\]/)?.[1] || '';
  const parameters = [...parametersBlock.matchAll(/name:\s*["'`]([^"'`]+)["'`][\s\S]*?type:\s*["'`]([^"'`]+)["'`][\s\S]*?required:\s*(true|false)[\s\S]*?description:\s*["'`]([^"'`]+)["'`]/g)]
    .map(m => ({ name: m[1], type: m[2], required: m[3] === 'true', description: m[4] }));
  if (!name || !endpoint) return null;
  return { name, description: description || '', method, endpoint, parameters, file };
}

const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.js') && f !== 'index.js');
const apis = files.map(getMeta).filter(Boolean);
fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), apis }, null, 2));
console.log(`Generated ${apis.length} API entries -> public/api-manifest.json`);
