const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const apiRoot = path.join(root, "api");
const configPath = path.join(__dirname, "api-definitions.json");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (name.endsWith(".js") && name !== "_helper.js") out.push(full);
  }
  return out;
}

function routeFromFile(file) {
  const rel = path.relative(apiRoot, file).replace(/\\/g, "/").replace(/\.js$/, "");
  const routeRel = rel === "index" ? "" : rel.endsWith("/index") ? rel.slice(0, -6) : rel;
  return `/api/${routeRel}`.replace(/\/$/, "");
}

function prettyName(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function detectMethod(source) {
  const allow = source.match(/res\.setHeader\(["']Allow["'],\s*["']([^"']+)["']\)/);
  if (allow) {
    const methods = allow[1].split(/\s*,\s*/).filter(Boolean);
    if (methods.length === 1) return methods[0];
    if (methods.includes("GET")) return "GET";
  }
  if (/req\.method\s*!==\s*["']GET["']/.test(source) && /POST/.test(source)) return "GET";
  if (/req\.method\s*!==\s*["']POST["']/.test(source) && /GET/.test(source)) return "POST";
  if (/\breq\.method\b/.test(source) && /POST/.test(source)) return "POST";
  return "GET";
}

function detectParameters(source) {
  const found = new Set();
  const patterns = [
    /\(\s*req\.query\s*\|\|\s*\{\}\s*\)\.([A-Za-z_$][\w$]*)/g,
    /req\.query\.([A-Za-z_$][\w$]*)/g,
    /req\.body\.([A-Za-z_$][\w$]*)/g
  ];
  for (const re of patterns) {
    let match;
    while ((match = re.exec(source))) found.add(match[1]);
  }
  return [...found].map(name => ({
    name,
    type: "string",
    required: false,
    description: `Parameter "${name}" for this endpoint.`,
    example: ""
  }));
}

function iconFor(name) {
  const n = name.toLowerCase();
  const map = [
    ["instagram","Instagram"],["facebook","Facebook"],["youtube","Youtube"],
    ["tiktok","Music2"],["twitter","Twitter"],["spotify","Music"],
    ["image","ImagePlus"],["qr","QrCode"],["weather","CloudSun"],
    ["ai","Bot"],["search","Search"],["tts","Volume2"]
  ];
  return (map.find(([key]) => n.includes(key)) || [null, "Code2"])[1];
}

const configured = fs.existsSync(configPath)
  ? JSON.parse(fs.readFileSync(configPath, "utf8"))
  : [];
const byEndpoint = new Map(configured.map(item => [item.endpoint, item]));

const files = walk(apiRoot);
const apis = files.map(file => {
  const endpoint = routeFromFile(file);
  const source = fs.readFileSync(file, "utf8");
  const rel = path.relative(apiRoot, file).replace(/\\/g, "/").replace(/\.js$/, "");
  const parts = rel.split("/");
  const fileName = parts[parts.length - 1];
  const fallbackSlug = parts.join("-").toLowerCase();
  const config = byEndpoint.get(endpoint);

  if (config) {
    return { ...config, endpoint, method: config.method || detectMethod(source) };
  }

  const category = parts.length > 1 ? prettyName(parts[0]) : "API";
  const name = prettyName(fileName);
  const parameters = detectParameters(source);
  return {
    slug: fallbackSlug,
    name,
    description: `Automatically detected ${name} API endpoint.`,
    category,
    method: detectMethod(source),
    endpoint,
    icon: iconFor(name),
    parameters,
    responseExample: { success: true, data: {} },
    responseFields: [
      { name: "success", type: "boolean", description: "Whether the request succeeded." },
      { name: "data", type: "object", description: "Endpoint response data." }
    ],
    exampleRequest: `${detectMethod(source)} https://samapi.example.com${endpoint}`,
  };
});

const manifest = {
  generatedAt: new Date().toISOString(),
  routes: apis.map(a => a.endpoint),
  apis
};

fs.writeFileSync(
  path.join(root, "public", "api-manifest.json"),
  JSON.stringify(manifest, null, 2)
);
console.log(`Generated ${apis.length} API routes.`);
