const crypto = require("crypto");

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "object") return req.body;
    if (typeof req.body === "string") {
      try { return req.body ? JSON.parse(req.body) : {}; }
      catch { throw new Error("Format JSON tidak valid."); }
    }
  }
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk.toString();
      if (raw.length > 1024 * 1024) {
        reject(new Error("Ukuran request terlalu besar."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error("Format JSON tidak valid.")); }
    });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Gunakan metode POST." });
  }

  try {
    const body = await readBody(req);
    const supplied = Buffer.from(String(body.password || ""));
    const configured = String(process.env.ADMIN_PASSWORD || "");
    if (!configured) {
      return send(res, 500, { error: "ADMIN_PASSWORD belum diatur di Vercel." });
    }

    const expected = Buffer.from(configured);
    if (supplied.length !== expected.length ||
        !crypto.timingSafeEqual(supplied, expected)) {
      return send(res, 401, { error: "Password admin salah." });
    }

    const secret = process.env.SESSION_SECRET || "";
    if (secret.length < 32) {
      return send(res, 500, { error: "SESSION_SECRET harus minimal 32 karakter." });
    }

    const stamp = String(Date.now());
    const signature = crypto.createHmac("sha256", secret)
      .update(stamp)
      .digest("hex");
    const token = encodeURIComponent(stamp + "." + signature);

    res.setHeader(
      "Set-Cookie",
      `cv_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`
    );
    return send(res, 200, { ok: true });
  } catch (error) {
    console.error("CodeVault login error:", error);
    return send(res, 400, { error: error.message || "Permintaan login tidak valid." });
  }
};
