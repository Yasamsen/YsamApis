const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const apiRoot = path.join(root, "api");

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (name.endsWith(".js") && name !== "_helper.js") out.push(full);
  }
  return out;
}

const routes = walk(apiRoot).map(file => {
  const rel = path.relative(apiRoot, file).replace(/\\/g, "/").replace(/\.js$/, "");
  return `/api/${rel === "index" ? "" : rel}`.replace(/\/$/, "");
});

fs.writeFileSync(
  path.join(root, "public", "api-manifest.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), routes }, null, 2)
);
console.log(`Generated ${routes.length} API routes.`);
