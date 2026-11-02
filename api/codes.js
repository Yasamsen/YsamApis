// GET  /api/codes  -> daftar (publik)
// POST /api/codes  -> tambah kode (owner)
const { crypto, getCol, send, isOwner, readBody, slugify, fields } = require("../lib/common");

module.exports = async (req, res) => {
  try {
    const col = await getCol();
    if (req.method === "GET") {
      const docs = await col.find({}, { projection: { code: 0 } }).sort({ updatedAt: -1 }).limit(300).toArray();
      return send(res, 200, docs.map(({ _id, ...d }) => ({ ...d, id: _id.toString() })));
    }
    if (req.method === "POST") {
      if (!isOwner(req)) return send(res, 401, { error: "Login owner diperlukan." });
      const f = fields(await readBody(req));
      if (!f.title || !f.code) return send(res, 400, { error: "Judul dan kode wajib diisi." });
      const now = new Date();
      const doc = { ...f, slug: slugify(f.title) + "-" + crypto.randomBytes(3).toString("hex"), views: 0, copies: 0, createdAt: now, updatedAt: now };
      const r = await col.insertOne(doc);
      return send(res, 201, { id: r.insertedId.toString(), slug: doc.slug });
    }
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "Metode tidak didukung." });
  } catch (e) {
    console.error("codes:", e);
    return send(res, 500, { error: e.message || "Terjadi kesalahan server." });
  }
};
