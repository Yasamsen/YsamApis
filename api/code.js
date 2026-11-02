// /api/code?id=<id|slug>
// GET (publik) | POST ?event=view|copy (publik, hitung statistik) | PUT, DELETE (owner)
const { getCol, send, isOwner, readBody, filterFor, fields } = require("../lib/common");

module.exports = async (req, res) => {
  try {
    const id = String((req.query && req.query.id) || "").trim();
    if (!id) return send(res, 400, { error: "ID kode tidak diberikan." });
    const col = await getCol();
    const filter = filterFor(id);

    if (req.method === "GET") {
      const d = await col.findOne(filter);
      if (!d) return send(res, 404, { error: "Kode tidak ditemukan." });
      const { _id, ...rest } = d;
      return send(res, 200, { ...rest, id: _id.toString() });
    }
    if (req.method === "POST") {
      const ev = req.query.event;
      if (ev !== "view" && ev !== "copy") return send(res, 400, { error: "Event tidak valid." });
      await col.updateOne(filter, { $inc: { [ev === "view" ? "views" : "copies"]: 1 } });
      return send(res, 200, { ok: true });
    }
    if (!isOwner(req)) return send(res, 401, { error: "Login owner diperlukan." });
    if (req.method === "PUT") {
      const f = fields(await readBody(req));
      if (!f.title || !f.code) return send(res, 400, { error: "Judul dan kode wajib diisi." });
      const r = await col.updateOne(filter, { $set: { ...f, updatedAt: new Date() } });
      return r.matchedCount ? send(res, 200, { ok: true }) : send(res, 404, { error: "Kode tidak ditemukan." });
    }
    if (req.method === "DELETE") {
      const r = await col.deleteOne(filter);
      return r.deletedCount ? send(res, 200, { ok: true }) : send(res, 404, { error: "Kode tidak ditemukan." });
    }
    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return send(res, 405, { error: "Metode tidak didukung." });
  } catch (e) {
    console.error("code:", e);
    return send(res, 500, { error: e.message || "Terjadi kesalahan server." });
  }
};
