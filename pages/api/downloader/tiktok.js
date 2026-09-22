/**
 * @method GET
 * @description Download video TikTok tanpa watermark.
 * @param url string required - URL video TikTok yang ingin diunduh.
 */
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'url' wajib diisi.",
    });
  }

  try {
    // TODO: ganti bagian ini dengan scraper/downloader TikTok yang sebenarnya.
    // Contoh di bawah hanya data dummy agar endpoint bisa langsung dicoba.
    return res.status(200).json({
      status: true,
      creator: "api-hub",
      result: {
        source_url: url,
        title: "Contoh judul video (dummy)",
        video_no_wm: "https://example.com/video-no-watermark.mp4",
        thumbnail: "https://example.com/thumbnail.jpg",
      },
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: "Terjadi kesalahan server." });
  }
}
