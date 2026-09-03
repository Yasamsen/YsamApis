// api/index.js
// Endpoint utama:
//   GET /api            -> daftar semua API (dipakai homepage & docs)
//   GET /api/status      -> status kesehatan API
// Semua request ke /api/* yang tidak cocok endpoint statis lain
// akan diteruskan ke module yang sesuai berdasarkan `endpoint` di file-nya.

const { loadApis, findHandlerByEndpoint } = require("./_registry");

const startTime = Date.now();

module.exports = async (req, res) => {
  const url = req.url.split("?")[0];

  // --- Endpoint: daftar semua API (untuk homepage & docs) ---
  if (url === "/api" || url === "/api/") {
    const apis = loadApis();
    return res.status(200).json({
      success: true,
      total: apis.length,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      data: apis,
    });
  }

  // --- Endpoint: status API ---
  if (url === "/api/status") {
    const apis = loadApis();
    return res.status(200).json({
      success: true,
      status: "online",
      total_endpoints: apis.length,
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    });
  }

  // --- Cari handler dinamis berdasarkan endpoint path persis ---
  const mod = findHandlerByEndpoint(url);

  if (mod) {
    if (mod.method && mod.method.toUpperCase() !== req.method.toUpperCase()) {
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} tidak diizinkan. Gunakan ${mod.method}.`,
      });
    }
    try {
      return await mod.handler(req, res);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
        error: err.message,
      });
    }
  }

  return res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan",
  });
};
