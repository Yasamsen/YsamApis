const { MongoClient, ObjectId } = require("mongodb");
const crypto = require("crypto");

let cachedClient;
async function getCollection() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI belum diatur");
  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGODB_URI);
    await cachedClient.connect();
  }
  const db = cachedClient.db(process.env.MONGODB_DB || "codevault");
  return db.collection("codes");
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}
function parseCookies(req) {
  const cookies = {};
  for (const item of (req.headers.cookie || "").split(";")) {
    const value = item.trim();
    if (!value) continue;
    const i = value.indexOf("=");
    if (i < 0) continue;
    const key = value.slice(0, i);
    const raw = value.slice(i + 1);
    try { cookies[key] = decodeURIComponent(raw); }
    catch { cookies[key] = raw; }
  }
  return cookies;
}
function sign(value) {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET || "").update(value).digest("hex");
}
function isOwner(req) {
  if (!process.env.SESSION_SECRET) return false;
  const token = parseCookies(req).cv_session || "";
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [stamp, mac] = parts;
  if (!/^\d+$/.test(stamp) || Date.now() - Number(stamp) > 8 * 60 * 60 * 1000) return false;
  const expected = sign(stamp);
  try {
    return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
  } catch { return false; }
}
function setSession(res) {
  const stamp = String(Date.now());
  const value = encodeURIComponent(stamp + "." + sign(stamp));
  res.setHeader("Set-Cookie", `cv_session=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`);
}
function clearSession(res) {
  res.setHeader("Set-Cookie", "cv_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
}
async function readBody(req) {
  // Vercel may provide an already-parsed body. Prefer it when available.
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "object") return req.body;
    if (typeof req.body === "string") {
      try { return req.body ? JSON.parse(req.body) : {}; }
      catch { throw new Error("Format JSON tidak valid"); }
    }
  }

  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk.toString();
      if (data.length > 1024 * 1024) {
        reject(new Error("Ukuran request terlalu besar"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(new Error("Format JSON tidak valid")); }
    });
    req.on("error", reject);
  });
}
function cleanText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 55) || "code";
}

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, "https://local.invalid");
    const parts = url.pathname.split("/").filter(Boolean);
    // Vercel catch-all endpoint: /api/... ; ignore leading "api".
    if (parts[0] === "api") parts.shift();
    const route = parts.join("/");
    const method = req.method;

    if (route === "auth/login" && method === "POST") {
      const body = await readBody(req);
      const supplied = Buffer.from(String(body.password || ""));
      const expected = Buffer.from(String(process.env.ADMIN_PASSWORD || ""));
      if (!expected.length || supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
        return send(res, 401, { error: "Password admin salah." });
      }
      if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
        return send(res, 500, { error: "SESSION_SECRET belum diatur dengan benar." });
      }
      setSession(res);
      return send(res, 200, { ok: true });
    }

    if (route === "auth/logout" && method === "POST") {
      clearSession(res);
      return send(res, 200, { ok: true });
    }
    if (route === "auth/me" && method === "GET") {
      return send(res, 200, { owner: isOwner(req) });
    }

    const collection = await getCollection();

    if (route === "codes" && method === "GET") {
      const docs = await collection.find({}, { projection: { title: 1, language: 1, description: 1, createdAt: 1, updatedAt: 1 } })
        .sort({ updatedAt: -1 }).limit(200).toArray();
      return send(res, 200, docs.map(d => ({ ...d, id: d._id.toString() })));
    }

    if (route === "codes" && method === "POST") {
      if (!isOwner(req)) return send(res, 401, { error: "Login owner diperlukan." });
      const body = await readBody(req);
      const title = cleanText(body.title, 120);
      const code = typeof body.code === "string" ? body.code.slice(0, 500000) : "";
      if (!title || !code) return send(res, 400, { error: "Judul dan kode wajib diisi." });
      const now = new Date();
      const doc = {
        title, code,
        language: cleanText(body.language, 40) || "text",
        description: cleanText(body.description, 500),
        slug: slugify(title) + "-" + crypto.randomBytes(3).toString("hex"),
        createdAt: now, updatedAt: now
      };
      const result = await collection.insertOne(doc);
      return send(res, 201, { id: result.insertedId.toString(), slug: doc.slug });
    }

    if (parts[0] === "codes" && parts[1] && method === "GET") {
      const id = parts[1];
      let doc = null;
      if (ObjectId.isValid(id)) doc = await collection.findOne({ _id: new ObjectId(id) });
      if (!doc) doc = await collection.findOne({ slug: id });
      if (!doc) return send(res, 404, { error: "Kode tidak ditemukan." });
      return send(res, 200, { id: doc._id.toString(), title: doc.title, code: doc.code, language: doc.language, description: doc.description, createdAt: doc.createdAt, updatedAt: doc.updatedAt });
    }

    if (parts[0] === "codes" && parts[1] && method === "PUT") {
      if (!isOwner(req)) return send(res, 401, { error: "Login owner diperlukan." });
      const id = parts[1];
      if (!ObjectId.isValid(id)) return send(res, 400, { error: "ID tidak valid." });
      const body = await readBody(req);
      const title = cleanText(body.title, 120);
      const code = typeof body.code === "string" ? body.code.slice(0, 500000) : "";
      if (!title || !code) return send(res, 400, { error: "Judul dan kode wajib diisi." });
      const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: {
        title, code, language: cleanText(body.language, 40) || "text",
        description: cleanText(body.description, 500), updatedAt: new Date()
      }});
      return send(res, result.matchedCount ? 200 : 404, result.matchedCount ? { ok: true } : { error: "Kode tidak ditemukan." });
    }

    if (parts[0] === "codes" && parts[1] && method === "DELETE") {
      if (!isOwner(req)) return send(res, 401, { error: "Login owner diperlukan." });
      if (!ObjectId.isValid(parts[1])) return send(res, 400, { error: "ID tidak valid." });
      const result = await collection.deleteOne({ _id: new ObjectId(parts[1]) });
      return send(res, result.deletedCount ? 200 : 404, result.deletedCount ? { ok: true } : { error: "Kode tidak ditemukan." });
    }

    return send(res, 404, { error: "Endpoint tidak ditemukan." });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: error.message || "Terjadi kesalahan server." });
  }
};
