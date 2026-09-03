// lib/respond.js
// Small shared helpers so every API handler returns a consistent JSON shape.
// Kept outside /api on purpose: Vercel turns every file under /api into a
// route, and this file isn't meant to be one.

function send(res, status, payload) {
  res.status(status).json(payload);
}

function ok(res, data, extra = {}) {
  return send(res, 200, { success: true, data, ...extra });
}

function fail(res, status, message) {
  return send(res, status, { success: false, message });
}

module.exports = { send, ok, fail };
