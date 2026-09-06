const { clearSessionCookie } = require("../_lib/session");

module.exports = async function handler(req, res) {
  clearSessionCookie(res);
  return res.json({ success: true, message: "Logged out." });
};
