// api/downloader/youtube.js
const createApi = require("../_lib/createApi");
const { requireParams } = require("../_lib/validate");

module.exports = createApi({
  name: "YouTube Downloader",
  description: "Download video atau audio dari YouTube",
  method: "GET",
  endpoint: "/api/downloader/youtube",
  category: "Downloader",
  parameters: [
    {
      name: "url",
      type: "string",
      required: true,
      example: "https://youtu.be/xxxxxxxxxxx"
    },
    {
      name: "quality",
      type: "string",
      required: false,
      example: "720p"
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
