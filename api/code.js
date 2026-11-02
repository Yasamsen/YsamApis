const { MongoClient, ObjectId } = require("mongodb");

let client;
async function getCollection() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI belum diatur di Vercel.");
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }
  return client.db(process.env.MONGODB_DB || "codevault").collection("codes");
}
function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}
module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "Endpoint detail hanya menerima GET." });
  }
  try {
    const id = String((req.query && req.query.id) || "").trim();
    if (!id) return send(res, 400, { error: "ID kode tidak diberikan." });
    const col = await getCollection();
    let doc = null;
    if (ObjectId.isValid(id)) doc = await col.findOne({ _id: new ObjectId(id) });
    if (!doc) doc = await col.findOne({ slug: id });
    if (!doc) return send(res, 404, { error: "Kode tidak ditemukan di database." });
    return send(res, 200, {
      id: doc._id.toString(),
      title: doc.title || "Tanpa judul",
      code: doc.code || "",
      language: doc.language || "text",
      description: doc.description || "",
      createdAt: doc.createdAt || null,
      updatedAt: doc.updatedAt || null
    });
  } catch (error) {
    console.error("CodeVault detail endpoint:", error);
    return send(res, 500, { error: error.message || "Gagal mengambil kode." });
  }
};
