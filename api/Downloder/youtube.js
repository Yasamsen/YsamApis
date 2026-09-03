// api/Downloder/youtube.js
module.exports = {
  name: "YouTube Downloader",
  description: "Download video/audio dari YouTube berdasarkan URL.",
  method: "GET",
  endpoint: "/api/youtube",
  category: "Downloader",
  params: [
    { name: "url", type: "string", required: true, description: "URL video YouTube" },
    { name: "type", type: "string", required: false, description: "mp3 atau mp4 (default: mp4)" },
  ],
  example: {
    request: "/api/youtube?url=https://youtu.be/xxxxx&type=mp3",
    response: {
      success: true,
      data: {
        title: "Contoh judul video",
        duration: "3:45",
        download_url: "https://example.com/audio.mp3",
      },
    },
  },
  async handler(req, res) {
    const { url, type } = req.query;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Parameter url diperlukan",
      });
    }

    // TODO: ganti dengan scraper YouTube kamu di sini
    return res.json({
      success: true,
      data: {
        title: "Contoh judul video",
        duration: "3:45",
        format: type || "mp4",
        download_url: "https://example.com/video.mp4",
      },
    });
  },
};
