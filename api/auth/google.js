const { generateState, getAuthorizationUrl } = require("../_lib/oauth");
const { setOAuthState } = require("../_lib/session");

module.exports = async function handler(req, res) {
  try {
    const state = generateState();
    setOAuthState(res, "google", state);
    const url = getAuthorizationUrl("google", req, state);
    res.writeHead(302, { Location: url });
    res.end();
  } catch (err) {
    console.error("google OAuth start error:", err.message);
    res.writeHead(302, { Location: "/login?error=oauth_not_configured" });
    res.end();
  }
};
