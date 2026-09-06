// Signed, stateless session cookies (no server-side session store required).
// The cookie only ever contains a userId + issued-at timestamp, HMAC-signed
// with SESSION_SECRET. Nothing secret is ever sent to the browser.

const crypto = require("crypto");

const SESSION_COOKIE = "samapi_session";
const STATE_COOKIE_PREFIX = "samapi_oauth_state_";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function createSignedValue(payloadObj) {
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function verifySignedValue(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  let expected;
  try {
    expected = sign(payload);
  } catch {
    return null;
  }

  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  });
  return cookies;
}

function isProduction() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

function buildCookie(name, value, { maxAge, httpOnly = true } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "SameSite=Lax"];
  if (httpOnly) parts.push("HttpOnly");
  if (isProduction()) parts.push("Secure");
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  return parts.join("; ");
}

function setSessionCookie(res, userId) {
  const token = createSignedValue({ userId, iat: Date.now() });
  res.setHeader("Set-Cookie", buildCookie(SESSION_COOKIE, token, { maxAge: 60 * 60 * 24 * 30 }));
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", buildCookie(SESSION_COOKIE, "", { maxAge: 0 }));
}

function getSession(req) {
  const cookies = parseCookies(req);
  const data = verifySignedValue(cookies[SESSION_COOKIE]);
  if (!data || !data.userId) return null;
  return data;
}

function setOAuthState(res, provider, state) {
  res.setHeader("Set-Cookie", buildCookie(`${STATE_COOKIE_PREFIX}${provider}`, state, { maxAge: 600 }));
}

function getOAuthState(req, provider) {
  const cookies = parseCookies(req);
  return cookies[`${STATE_COOKIE_PREFIX}${provider}`];
}

module.exports = {
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  setOAuthState,
  getOAuthState,
};
