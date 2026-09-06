// Placeholder – individual downloader endpoints live in sibling files.
// This file is intentionally not included in the API manifest.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    success: true,
    message: 'Downloader category. Use /api/downloader/tiktok, /youtube, or /instagram.',
    endpoints: [
      '/api/downloader/tiktok',
      '/api/downloader/youtube',
      '/api/downloader/instagram'
    ]
  });
};
