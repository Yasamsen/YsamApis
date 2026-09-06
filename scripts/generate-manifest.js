// Scans the api/ directory recursively, loads each API module's attached
// `.meta` metadata, validates it, and writes public/api-manifest.json.
// The frontend (homepage, docs, explorer, search) reads ONLY this file —
// nothing is hardcoded, so adding a new file under api/ is enough to make
// a new API show up everywhere automatically after `npm run build`.

const fs = require("fs");
const path = require("path");

const API_ROOT = path.join(__dirname, "..", "api");
const OUTPUT_PATH = path.join(__dirname, "..", "public", "api-manifest.json");

// Internal folders that are NOT public API endpoints (auth flow, shared libs).
const EXCLUDED_DIRS = new Set(["_lib", "auth"]);
const REQUIRED_META_FIELDS = ["name", "description", "method", "endpoint", "category", "parameters"];

function findApiFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      files = files.concat(findApiFiles(fullPath));
      continue;
    }

    if (!entry.name.endsWith(".js")) continue;
    if (entry.name.startsWith("_")) continue;

    files.push(fullPath);
  }

  return files;
}

function categoryFromPath(relativePath) {
  const parts = relativePath.split(path.sep);
  if (parts.length > 1) {
    const folder = parts[0];
    return folder.charAt(0).toUpperCase() + folder.slice(1);
  }
  return "General";
}

function main() {
  console.log("SamApi Manifest Generator\n");
  console.log("Scanning API directory...\n");

  if (!fs.existsSync(API_ROOT)) {
    console.error(`API directory not found: ${API_ROOT}`);
    process.exit(1);
  }

  const files = findApiFiles(API_ROOT);
  const manifest = [];
  const categorySet = new Set();
  const errors = [];

  for (const file of files) {
    const relativePath = path.relative(API_ROOT, file);
    const key = relativePath.replace(/\.js$/, "").split(path.sep).join("/");

    let mod;
    try {
      delete require.cache[require.resolve(file)];
      mod = require(file);
    } catch (err) {
      errors.push(`${key}\n  Failed to load module: ${err.message}`);
      continue;
    }

    const meta = mod && mod.meta;

    if (typeof mod !== "function" || !meta) {
      errors.push(`${key}\n  Missing exported handler function with attached metadata`);
      continue;
    }

    const missingFields = REQUIRED_META_FIELDS.filter(
      (field) => meta[field] === undefined || meta[field] === null
    );
    if (missingFields.length > 0) {
      errors.push(`${key}\n  Missing required field: ${missingFields.join(", ")}`);
      continue;
    }

    const category = meta.category || categoryFromPath(relativePath);
    categorySet.add(category);

    manifest.push({
      name: meta.name,
      description: meta.description,
      method: meta.method,
      endpoint: meta.endpoint,
      category,
      parameters: meta.parameters || [],
    });

    console.log(`✓ ${key}`);
  }

  if (errors.length > 0) {
    console.error("\nManifest generation failed:\n");
    errors.forEach((e) => console.error(e + "\n"));
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2));

  console.log(`\nGenerated:\npublic/api-manifest.json\n`);
  console.log(`Total APIs: ${manifest.length}`);
  console.log(`Categories: ${categorySet.size}`);
}

main();
