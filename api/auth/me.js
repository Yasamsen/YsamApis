const { getSession } = require("../_lib/session");
const { getUsersCollection } = require("../_lib/mongodb");

module.exports = async function handler(req, res) {
  try {
    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
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
      console.error("MongoDB connection error:", err.message);
      return res.status(503).json({ success: false, message: "Database service temporarily unavailable." });
    }

    const user = await usersCol.findOne({ _id: userId });
    if (!user) {
      return res.status(401).json({ success: false, message: "Session invalid." });
    }

    return res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        createdAt: user.createdAt,
        usage: user.usage,
        limit: user.limit,
        remaining: Math.max(user.limit - user.usage, 0),
      },
    });
  } catch (err) {
    console.error("/api/auth/me error:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
