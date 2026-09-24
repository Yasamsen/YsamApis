function json(res, status, data) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(JSON.stringify(data));
}

function getUrl(req) {
  const q = req.query || {};
  return q.url || q.link || q.u || null;
}

function getProviderBase(platform) {
  const key = String(platform || "").toUpperCase() + "_API_URL";
  return process.env[key] || process.env.DOWNLOADER_API_URL || null;
}

async function proxyJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: response.status, data };
}

module.exports = { json, getUrl, getProviderBase, proxyJson };
