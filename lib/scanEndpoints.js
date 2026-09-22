import fs from "fs";
import path from "path";

const API_DIR = path.join(process.cwd(), "pages", "api");
const IGNORE_FILES = new Set(["hello.js"]);

/**
 * Extracts a leading /** ... *\/ doc comment and turns @tags into structured
 * metadata. This is how new endpoints get "auto-detected": just add the file,
 * describe it with this comment block, and it shows up on the homepage.
 */
function parseMeta(source) {
  const meta = {
    method: "GET",
    description: "Belum ada deskripsi.",
    params: [],
  };

  const match = source.match(/\/\*\*([\s\S]*?)\*\//);
  if (!match) return meta;

  const lines = match[1]
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, "").trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.startsWith("@method")) {
      meta.method = line.replace("@method", "").trim().toUpperCase();
    } else if (line.startsWith("@description")) {
      meta.description = line.replace("@description", "").trim();
    } else if (line.startsWith("@param")) {
      const rest = line.replace("@param", "").trim();
      const paramMatch = rest.match(/^(\S+)\s+(\S+)\s+(required|optional)\s*-?\s*(.*)$/i);
      if (paramMatch) {
        meta.params.push({
          name: paramMatch[1],
          type: paramMatch[2],
          required: paramMatch[3].toLowerCase() === "required",
          description: paramMatch[4] || "",
        });
      }
    }
  }

  return meta;
}

function walk(dir, baseRoute) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results = results.concat(walk(fullPath, `${baseRoute}/${entry.name}`));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!/\.(js|ts)$/.test(entry.name)) continue;
    if (entry.name.startsWith("_")) continue;
    if (IGNORE_FILES.has(entry.name)) continue;

    const name = entry.name.replace(/\.(js|ts)$/, "");
    const route = `${baseRoute}/${name}`;
    const source = fs.readFileSync(fullPath, "utf-8");
    const meta = parseMeta(source);

    const relFromApi = path.relative(API_DIR, fullPath);
    const segments = relFromApi.split(path.sep);
    segments.pop();
    const category = segments.length > 0 ? segments.join("/") : "umum";

    results.push({
      name,
      route,
      category,
      method: meta.method,
      description: meta.description,
      params: meta.params,
    });
  }

  return results;
}

export function scanEndpoints() {
  if (!fs.existsSync(API_DIR)) return [];
  return walk(API_DIR, "/api").sort((a, b) => a.route.localeCompare(b.route));
}

export function groupByCategory(endpoints) {
  const groups = {};
  for (const ep of endpoints) {
    if (!groups[ep.category]) groups[ep.category] = [];
    groups[ep.category].push(ep);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}
