// api/_lib/validate.js
// Helper kecil untuk memvalidasi parameter wajib dari req.query / req.body.

function requireParams(source, names) {
  const missing = names.filter((name) => {
    const value = source ? source[name] : undefined;
    return value === undefined || value === null || value === "";
  });

  return {
    ok: missing.length === 0,
    missing
  };
}

module.exports = { requireParams };
