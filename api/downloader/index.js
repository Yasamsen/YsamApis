const { json } = require("./_helper");

module.exports = async function handler(req, res) {
  const platform = String((req.query || {}).platform || "").toLowerCase();
  const url = (req.query || {}).url || (req.query || {}).link;

  if (!platform) {
    return json(res, 400, {
      success: false,
      error: "Parameter 'platform' is required",
      supported: ["instagram", "tiktok", "youtube"]
    });
  }

  if (!["instagram", "tiktok", "youtube"].includes(platform)) {
    return json(res, 400, {
      success: false,
      error: "Unsupported platform",
      supported: ["instagram", "tiktok", "youtube"]
    });
  }

  if (!url) {
    return json(res, 400, { success: false, error: "Parameter 'url' is required" });
  }

  // Redirect to the platform-specific serverless function.
  const host = req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const location = `${proto}://${host}/api/downloader/${platform}?url=${encodeURIComponent(url)}`;
  res.statusCode = 307;
  res.setHeader("Location", location);
  return res.end();
};
