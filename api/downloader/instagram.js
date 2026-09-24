const { json, getUrl, getProviderBase, proxyJson } = require("./_helper");

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { success: false, error: "Method not allowed" });
  }

  const url = getUrl(req);
  if (!url) {
    return json(res, 400, {
      success: false,
      error: "Parameter 'url' is required",
      example: "/api/downloader/PLATFORM?url=https://..."
    });
  }

  const base = getProviderBase("instagram");
  if (!base) {
    return json(res, 501, {
      success: false,
      error: "Downloader provider is not configured",
      message: "Set instagram_API_URL or DOWNLOADER_API_URL in Vercel Environment Variables."
    });
  }

  try {
    const target = new URL(base);
    target.searchParams.set("url", url);
    const result = await proxyJson(target.toString(), {
      headers: { "Accept": "application/json" }
    });
    return json(res, result.status, result.data);
  } catch (error) {
    return json(res, 502, {
      success: false,
      error: "Provider request failed",
      message: error.message
    });
  }
};
