// api/_registry.js
// Util untuk membaca semua module API di folder ini (termasuk subfolder)
// secara otomatis, sehingga frontend (index.js) & docs bisa menampilkan
// daftar endpoint tanpa perlu didaftarkan manual satu-satu.

const fs = require("fs");
const path = require("path");

/**
 * Mengambil semua file .js di dalam folder `api/` (rekursif),
 * kecuali file yang diawali underscore (_registry.js, _utils.js, dst)
 * dan file index.js utama.
 */
function getAllApiFiles(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getAllApiFiles(fullPath, baseDir));
    } else if (
      file.endsWith(".js") &&
      !file.startsWith("_") &&
      file !== "index.js"
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Memuat semua module API dan mengembalikan array metadata + handler.
 * Setiap file module WAJIB export object dengan bentuk:
 * {
 *   name, description, method, endpoint, category?, params?, example?, handler
 * }
 */
function loadApis() {
  const apiDir = __dirname;
  const files = getAllApiFiles(apiDir);
  const apis = [];

  for (const file of files) {
    try {
      delete require.cache[require.resolve(file)];
      const mod = require(file);

      if (mod && mod.endpoint && typeof mod.handler === "function") {
        const relative = path
          .relative(apiDir, file)
          .replace(/\\/g, "/")
          .replace(/\.js$/, "");
        const category = relative.includes("/")
          ? relative.split("/")[0]
          : "General";

        apis.push({
          name: mod.name || relative,
          description: mod.description || "",
          method: (mod.method || "GET").toUpperCase(),
          endpoint: mod.endpoint,
          category: mod.category || category,
          params: mod.params || [],
          example: mod.example || null,
          file: relative,
        });
      }
    } catch (err) {
      console.error(`Gagal memuat module API: ${file}`, err.message);
    }
  }

  return apis;
}

/**
 * Mencari module handler berdasarkan endpoint path (untuk router index.js)
 */
function findHandlerByEndpoint(endpointPath) {
  const apiDir = __dirname;
  const files = getAllApiFiles(apiDir);

  for (const file of files) {
    try {
      delete require.cache[require.resolve(file)];
      const mod = require(file);
      if (mod && mod.endpoint === endpointPath) {
        return mod;
      }
    } catch (err) {
      console.error(`Gagal memuat module API: ${file}`, err.message);
    }
  }
  return null;
}

module.exports = { getAllApiFiles, loadApis, findHandlerByEndpoint };
