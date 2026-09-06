const { withApiLimit } = require("../_lib/withApi");

const meta = {
  name: "YouTube Downloader",
  description: "Download media from YouTube",
  method: "GET",
  endpoint: "/api/downloader/youtube",
  category: "Downloader",
  parameters: [
    { name: "url", type: "string", required: true, example: "https://example.com" },
  ],
};

async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ success: false, message: "Parameter url diperlukan" });
  }
  return res.json({ success: false, message: "Endpoint belum dikonfigurasi." });
}

module.exports = withApiLimit({ ...meta, handler });
module.exports.meta = meta;
