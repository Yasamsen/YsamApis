// api/Downloder/instagram.js
module.exports = {
  name: "Instagram Downloader",
  description: "Download media (foto/video) dari Instagram menggunakan URL post.",
  method: "GET",
  endpoint: "/api/instagram",
  category: "Downloader",
  params: [
    { name: "url", type: "string", required: true, description: "URL post Instagram" },
  ],
  example: {
    request: "/api/instagram?url=https://www.instagram.com/p/xxxxx",
    response: {
      success: true,
      data: {
        type: "video",
        url: "https://example.com/media.mp4",
        caption: "Contoh caption",
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

    // TODO: ganti dengan scraper Instagram kamu di sini
    return res.json({
      success: true,
      data: {
        type: "video",
        url: "https://example.com/media.mp4",
        caption: "Contoh hasil scraping",
      },
    });
  },
};
