// api/_lib/createApi.js
//
// Adapter internal. File-file di dalam "api/" ditulis sebagai object
// { name, description, method, endpoint, category, parameters, handler }
// supaya mudah dibaca dan otomatis terdeteksi oleh generate-manifest.js.
//
// Tapi Vercel Serverless Functions butuh setiap file meng-export sebuah
// FUNGSI dengan signature (req, res). createApi() membungkus object
// tersebut menjadi fungsi yang valid untuk Vercel, sambil tetap
// menempelkan metadata aslinya di `handler.meta` supaya script build
// (scripts/generate-manifest.js) bisa membacanya tanpa mengubah konsep
// penulisan API sama sekali.

function createApi(definition) {
  if (!definition || typeof definition.handler !== "function") {
    throw new Error("createApi: 'handler' wajib berupa function");
  }

  const handler = async (req, res) => {
    // CORS dasar supaya API bisa dites langsung dari browser (Try API)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    try {
      await definition.handler(req, res);
    } catch (err) {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Terjadi kesalahan pada server",
          error: err && err.message ? err.message : String(err)
        });
      }
    }
  };

  handler.meta = {
    name: definition.name || "Unnamed API",
    description: definition.description || "",
    method: (definition.method || "GET").toUpperCase(),
    endpoint: definition.endpoint,
    category: definition.category,
    parameters: Array.isArray(definition.parameters) ? definition.parameters : []
  };

  return handler;
}

module.exports = createApi;
