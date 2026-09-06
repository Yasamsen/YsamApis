const { exchangeCodeForToken, fetchNormalizedProfile } = require("../../_lib/oauth");
const { getOAuthState, setSessionCookie } = require("../../_lib/session");
const { getUsersCollection } = require("../../_lib/mongodb");

const PROVIDER = "github";

module.exports = async function handler(req, res) {
  try {
    const { code, state, error } = req.query;

    if (error) {
      res.writeHead(302, { Location: "/login?error=access_denied" });
      return res.end();
    }

    const expectedState = getOAuthState(req, PROVIDER);
    if (!code || !state || !expectedState || state !== expectedState) {
      res.writeHead(302, { Location: "/login?error=invalid_state" });
      return res.end();
    }

    let accessToken;
    try {
      accessToken = await exchangeCodeForToken(PROVIDER, req, code);
    } catch (err) {
      console.error(PROVIDER + " token exchange error:", err.message);
      res.writeHead(302, { Location: "/login?error=oauth_failed" });
      return res.end();
    }

    const profile = await fetchNormalizedProfile(PROVIDER, accessToken);
    if (!profile || !profile.providerId) {
      res.writeHead(302, { Location: "/login?error=profile_failed" });
      return res.end();
    }

    let usersCol;
    try {
      usersCol = await getUsersCollection();
    } catch (dbErr) {
      console.error("MongoDB connection error:", dbErr.message);
      res.writeHead(302, { Location: "/login?error=database_unavailable" });
      return res.end();
    }

    const now = new Date();
    const result = await usersCol.findOneAndUpdate(
      { provider: PROVIDER, providerId: profile.providerId },
      {
        $set: {
          name: profile.name,
          email: profile.email,
          avatar: profile.avatar,
          updatedAt: now,
        },
        $setOnInsert: {
          provider: PROVIDER,
          providerId: profile.providerId,
          usage: 0,
          limit: 30,
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after", includeResultMetadata: true }
    );

    const user = result.value;
    setSessionCookie(res, user._id.toString());
    res.writeHead(302, { Location: "/account" });
    res.end();
  } catch (err) {
    console.error(PROVIDER + " OAuth callback error:", err.message);
    res.writeHead(302, { Location: "/login?error=oauth_failed" });
    res.end();
  }
};
