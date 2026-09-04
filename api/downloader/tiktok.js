// api/downloader/tiktok.js
const createApi = require("../_lib/createApi");
const { requireParams } = require("../_lib/validate");

module.exports = createApi({
  name: "TikTok Downloader",
  description: "Download media dari TikTok tanpa watermark",
  method: "GET",
  endpoint: "/api/downloader/tiktok",
  category: "Downloader",
  parameters: [
    {
      name: "url",
      type: "string",
      required: true,
      example: "https://vt.tiktok.com/xxxxxx"
    }
  ],
  async handler(req, res) {
    const { url } = req.query || {};

    const check = requireParams(req.query, ["url"]);
    if (!check.ok) {
      return res.status(400).json({
        success: false,
        message: `Parameter wajib diperlukan: ${check.missing.join(", ")}`
      });
    }

    // Implementasi scraper/API pihak ketiga belum dipasang.
    // Struktur endpoint ini sudah siap untuk dikembangkan lebih lanjut.
    void url;

    return res.status(501).json({
      success: false,
      message: "Endpoint belum dikonfigurasi."
    });
  }
});
