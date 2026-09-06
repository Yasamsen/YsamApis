// Wraps a { name, description, method, endpoint, category, parameters, handler }
// API module with:
//   1. session validation (must be logged in)
//   2. server-side, atomic, per-account usage limiting (30 requests)
//   3. usage info attached to successful JSON responses
//
// The identity of the caller ALWAYS comes from the signed session cookie —
// never from query params, body, or any client-supplied field.

const { getSession } = require("./session");
const { getUsersCollection } = require("./mongodb");

const FREE_LIMIT_DEFAULT = 30;

function withApiLimit(apiModule) {
  return async function wrappedHandler(req, res) {
    try {
      const session = getSession(req);
      if (!session || !session.userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required. Please sign in to use SamApi APIs.",
        });
      }

      let ObjectId;
      let userId;
      try {
        ({ ObjectId } = require("mongodb"));
        userId = new ObjectId(session.userId);
      } catch {
        return res.status(401).json({ success: false, message: "Invalid session." });
      }

      let usersCol;
      try {
        usersCol = await getUsersCollection();
      } catch (err) {
        console.error("MongoDB connection error:", err);
        return res.status(503).json({
          success: false,
          message: "Database service temporarily unavailable.",
        });
      }

      // Atomic increment: only succeeds if usage is still below the limit,
      // so two concurrent requests can never both sneak past request #30.
      const result = await usersCol.findOneAndUpdate(
        { _id: userId, $expr: { $lt: ["$usage", "$limit"] } },
        { $inc: { usage: 1 }, $set: { updatedAt: new Date() } },
        { returnDocument: "after", includeResultMetadata: true }
      );

      const updatedUser = result && result.value;

      if (!updatedUser) {
        const current = await usersCol.findOne({ _id: userId });
        const limit = current ? current.limit : FREE_LIMIT_DEFAULT;
        return res.status(429).json({
          success: false,
          message: "API request limit reached.",
          limit,
          used: limit,
          remaining: 0,
        });
      }

      const usage = {
        used: updatedUser.usage,
        limit: updatedUser.limit,
        remaining: Math.max(updatedUser.limit - updatedUser.usage, 0),
      };

      req.user = {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
      };

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (body && body.success !== false && !body.usage) {
          body.usage = usage;
        }
        return originalJson(body);
      };

      return await apiModule.handler(req, res);
    } catch (err) {
      console.error("API wrapper error:", err);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  };
}

module.exports = { withApiLimit };
