const { generateState, getAuthorizationUrl } = require("../_lib/oauth");
const { setOAuthState } = require("../_lib/session");

module.exports = async function handler(req, res) {
  try {
    const state = generateState();
    setOAuthState(res, "github", state);
    const url = getAuthorizationUrl("github", req, state);
    res.writeHead(302, { Location: url });
    res.end();
  } catch (err) {
    console.error("github OAuth start error:", err.message);
    res.writeHead(302, { Location: "/login?error=oauth_not_configured" });
    res.end();
  }
};
