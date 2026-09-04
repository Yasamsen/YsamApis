// scripts/generate-manifest.js
//
// Membaca seluruh file di folder "api/" (termasuk subfolder), lalu
// menghasilkan "public/api-manifest.json". Frontend (homepage, API
// Explorer, Documentation, Search, Sidebar, Statistik, Category)
// membaca file JSON ini saja — tidak pernah menyentuh filesystem.
//
// Menambah API baru = menambah file baru di api/**.js lalu jalankan
// ulang "npm run build". Tidak perlu mengedit frontend sama sekali.

const fs = require("fs");
const path = require("path");

const API_DIR = path.join(__dirname, "..", "api");
const OUTPUT_FILE = path.join(__dirname, "..", "public", "api-manifest.json");

function toTitleCase(str) {
  return str
    .split(/[-_]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// File/folder yang diawali "_" (mis. api/_lib) sengaja dilewati:
// itu adalah helper internal, bukan endpoint.
function shouldSkip(name) {
  return name.startsWith("_") || name.startsWith(".");
}

function walk(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldSkip(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      results.push(fullPath);
    }
  }

  return results;
}

function buildManifest() {
  if (!fs.existsSync(API_DIR)) {
    console.warn("Folder api/ tidak ditemukan, manifest kosong dibuat.");
    fs.writeFileSync(OUTPUT_FILE, "[]\n");
    return;
  }

  const files = walk(API_DIR);
  const manifest = [];

  for (const file of files) {
    let mod;
    try {
      delete require.cache[require.resolve(file)];
      mod = require(file);
    } catch (err) {
      console.warn(`⚠ Melewati ${path.relative(process.cwd(), file)}: gagal dimuat (${err.message})`);
      continue;
    }

    const meta = mod && mod.meta;
    if (!meta || !meta.endpoint) {
      console.warn(`⚠ Melewati ${path.relative(process.cwd(), file)}: tidak ada metadata valid (bukan hasil createApi)`);
      continue;
    }

    const relativeToApi = path.relative(API_DIR, file);
    const topFolder = relativeToApi.split(path.sep)[0];
    const isDirectlyInApiRoot = topFolder.endsWith(".js");
    const category = meta.category || (isDirectlyInApiRoot ? "Other" : toTitleCase(topFolder));

    manifest.push({
      name: meta.name,
      description: meta.description,
      method: meta.method,
      endpoint: meta.endpoint,
      category,
      parameters: meta.parameters
    });
  }

  manifest.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`✓ Manifest dibuat: ${manifest.length} API ditemukan → ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  manifest.forEach((api) => console.log(`  - [${api.category}] ${api.method} ${api.endpoint}`));
}

buildManifest();
