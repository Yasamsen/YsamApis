const { MongoClient, ObjectId } = require("mongodb");
const crypto = require("crypto");

let client;
async function getCol() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI belum diatur di Vercel.");
  if (!client) { client = new MongoClient(process.env.MONGODB_URI); await client.connect(); }
  return client.db(process.env.MONGODB_DB || "codevault").collection("codes");
}
function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}
function cookies(req) {
  const out = {};
  for (const item of (req.headers.cookie || "").split(";")) {
    const v = item.trim(), i = v.indexOf("=");
    if (i < 0) continue;
    try { out[v.slice(0, i)] = decodeURIComponent(v.slice(i + 1)); } catch { out[v.slice(0, i)] = v.slice(i + 1); }
  }
  return out;
}
const sign = v => crypto.createHmac("sha256", process.env.SESSION_SECRET || "").update(v).digest("hex");
function isOwner(req) {
  if (!process.env.SESSION_SECRET) return false;
  const parts = (cookies(req).cv_session || "").split(".");
  if (parts.length !== 2 || !/^\d+$/.test(parts[0]) || Date.now() - Number(parts[0]) > 8 * 3600 * 1000) return false;
  try { return crypto.timingSafeEqual(Buffer.from(parts[1]), Buffer.from(sign(parts[0]))); } catch { return false; }
}
async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "object") return req.body;
    try { return req.body ? JSON.parse(req.body) : {}; } catch { throw new Error("Format JSON tidak valid."); }
  }
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", c => { raw += c; if (raw.length > 1024 * 1024) { reject(new Error("Request terlalu besar.")); req.destroy(); } });
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("Format JSON tidak valid.")); } });
    req.on("error", reject);
  });
}
const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const slugify = v => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 55) || "code";
// id bisa berupa ObjectId atau slug
function filterFor(id) {
  const or = [{ slug: id }];
  if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) or.unshift({ _id: new ObjectId(id) });
  return { $or: or };
}
// bentuk data yang dikirim ke browser
function fields(body) {
  return {
    title: clean(body.title, 120),
    code: typeof body.code === "string" ? body.code.slice(0, 500000) : "",
    language: clean(body.language, 40).toLowerCase() || "text",
    category: clean(body.category, 40) || "Lainnya",
    install: clean(body.install, 200),
    description: clean(body.description, 500)
  };
}
module.exports = { ObjectId, crypto, getCol, send, isOwner, readBody, slugify, filterFor, fields, cookies };
