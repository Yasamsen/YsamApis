// /raw/<slug> (lewat rewrite di vercel.json) -> kode mentah, cocok untuk: curl -sL https://domain/raw/slug
const { getCol, filterFor } = require("../lib/common");

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  try {
    const id = String((req.query && req.query.id) || "").trim();
    const col = await getCol();
    const d = id && await col.findOne(filterFor(id), { projection: { code: 1 } });
    if (!d) { res.statusCode = 404; return res.end("Kode tidak ditemukan.\n"); }
    if (/curl|wget|httpie/i.test(req.headers["user-agent"] || "")) col.updateOne({ _id: d._id }, { $inc: { copies: 1 } }).catch(() => {});
    res.statusCode = 200;
    return res.end(d.code || "");
  } catch (e) {
    console.error("raw:", e);
    res.statusCode = 500;
    return res.end("Terjadi kesalahan server.\n");
  }
};
