// api/downloader/instagram.js
const createApi = require("../_lib/createApi");
const { requireParams } = require("../_lib/validate");

module.exports = createApi({
  name: "Instagram Downloader",
  description: "Download foto, video, atau reels dari Instagram",
  method: "GET",
  endpoint: "/api/downloader/instagram",
  category: "Downloader",
  parameters: [
    {
      name: "url",
      type: "string",
      required: true,
      example: "https://www.instagram.com/p/xxxxxxxxxxx"
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

    void url;

    return res.status(501).json({
      success: false,
      message: "Endpoint belum dikonfigurasi."
    });
  }
});
