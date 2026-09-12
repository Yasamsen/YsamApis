const bcrypt = require('bcryptjs');
const { getDb } = require('./mongodb');

const SALT_ROUNDS = 12;

async function hashKey(plainKey) {
  return bcrypt.hash(plainKey, SALT_ROUNDS);
}

async function compareKey(plainKey, hash) {
  return bcrypt.compare(plainKey, hash);
}

/**
 * Authenticate an access key.
 * Returns { role, keyId, label } or null if invalid.
 * Checks both ADMIN_KEY_HASH (env) and access_keys collection.
 */
async function authenticateKey(plainKey) {
  if (!plainKey || typeof plainKey !== 'string' || plainKey.trim().length < 4) {
    return null;
  }

  const trimmed = plainKey.trim();

  // 1. Check Admin Key from environment
  const adminHash = process.env.ADMIN_KEY_HASH;
  if (adminHash) {
    const isAdmin = await compareKey(trimmed, adminHash);
    if (isAdmin) {
      return {
        role: 'admin',
        keyId: 'admin-env',
        label: 'Administrator',
        status: 'active',
      };
    }
  }

  // 2. Check User Keys in database
  const db = getDb();
  const keys = await db.collection('access_keys').find({ status: 'active' }).toArray();

  for (const keyDoc of keys) {
    // Skip expired keys
    if (keyDoc.expiresAt && new Date(keyDoc.expiresAt) < new Date()) {
      continue;
    }

    const match = await compareKey(trimmed, keyDoc.keyHash);
    if (match) {
      // Update lastUsedAt
      await db.collection('access_keys').updateOne(
        { _id: keyDoc._id },
        { $set: { lastUsedAt: new Date() } }
      );

      return {
        role: keyDoc.role || 'user',
        keyId: keyDoc._id.toString(),
        label: keyDoc.label || 'User',
        status: keyDoc.status,
      };
    }
  }

  return null;
}

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Please login first' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Please login first' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden', message: 'Admin access required' });
  }
  next();
}

function requireUserOrAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Please login first' });
  }
  if (req.session.user.role !== 'user' && req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden', message: 'Access denied' });
  }
  next();
}

module.exports = {
  hashKey,
  compareKey,
  authenticateKey,
  requireAuth,
  requireAdmin,
  requireUserOrAdmin,
};
