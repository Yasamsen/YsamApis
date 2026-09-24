function json(res, status, data) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { success: false, error: "Method not allowed" });
  }

  const q = String((req.query || {}).q || "").trim();
  if (!q) return json(res, 400, { success: false, error: "Parameter 'q' is required" });

  // Configure SEARCH_API_URL in Vercel to connect this example route
  // to your actual search provider.
  const base = process.env.SEARCH_API_URL;
  if (!base) {
    return json(res, 501, {
      success: false,
      error: "Search provider is not configured",
      message: "Set SEARCH_API_URL in Vercel Environment Variables."
    });
  }

  try {
    const target = new URL(base);
    target.searchParams.set("q", q);
    const response = await fetch(target.toString(), { headers: { Accept: "application/json" } });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return json(res, response.status, data);
  } catch (error) {
    return json(res, 502, { success: false, error: "Provider request failed", message: error.message });
  }
};
