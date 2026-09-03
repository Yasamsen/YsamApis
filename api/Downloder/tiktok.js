// api/Downloder/tiktok.js
module.exports = {
  name: "TikTok Downloader",
  description: "Download video TikTok tanpa watermark.",
  method: "GET",
  endpoint: "/api/tiktok",
  category: "Downloader",
  params: [
    { name: "url", type: "string", required: true, description: "URL video TikTok" },
  ],
  example: {
    request: "/api/tiktok?url=https://vt.tiktok.com/xxxxx",
    response: {
      success: true,
      data: {
        title: "Contoh judul video",
        no_watermark: "https://example.com/video-nowm.mp4",
        author: "username",
      },
    },
  },
  async handler(req, res) {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Parameter url diperlukan",
      });
    }

    // TODO: ganti dengan scraper TikTok kamu di sini
    return res.json({
      success: true,
      data: {
        title: "Contoh judul video",
        no_watermark: "https://example.com/video-nowm.mp4",
        author: "username",
      },
    });
  },
};
