const { send } = require("../lib/common");
module.exports = (req, res) => {
  res.setHeader("Set-Cookie", "cv_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
  send(res, 200, { ok: true });
};
