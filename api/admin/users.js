const { getDb } = require('../../lib/mongodb');

module.exports = async function listUsers(req, res) {
  try {
    const db = getDb();
    const keys = await db.collection('access_keys')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const result = keys.map((k) => ({
      id: k._id.toString(),
      label: k.label,
      role: k.role,
      status: k.status,
      createdAt: k.createdAt,
      expiresAt: k.expiresAt || null,
      lastUsedAt: k.lastUsedAt || null,
      // Never return the hash
    }));

    return res.json({ success: true, keys: result });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to list user keys',
    });
  }
};
