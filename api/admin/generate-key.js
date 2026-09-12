const { hashKey } = require('../../lib/auth');
const { getDb } = require('../../lib/mongodb');

function generateRandomKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [];
  for (let s = 0; s < 3; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(seg);
  }
  return segments.join('-');
}

module.exports = async function generateKey(req, res) {
  try {
    const { label, key: customKey, expiresAt, status = 'active' } = req.body;

    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid label',
        message: 'Label is required',
      });
    }

    let plainKey = customKey && typeof customKey === 'string' && customKey.trim().length >= 4
      ? customKey.trim()
      : generateRandomKey();

    if (plainKey.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Key too short',
        message: 'Access key must be at least 4 characters',
      });
    }

    const keyHash = await hashKey(plainKey);
    const db = getDb();

    // Ensure uniqueness by checking hash (extremely unlikely collision, but safe)
    const existing = await db.collection('access_keys').findOne({ keyHash });
    if (existing) {
      // Regenerate once if custom key collides
      if (customKey) {
        return res.status(409).json({
          success: false,
          error: 'Key already exists',
          message: 'This key is already in use. Choose a different key.',
        });
      }
      plainKey = generateRandomKey();
    }

    let expires = null;
    if (expiresAt && expiresAt !== 'never' && expiresAt !== '') {
      expires = new Date(expiresAt);
      if (isNaN(expires.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid expiration date',
        });
      }
    }

    const now = new Date();
    const doc = {
      keyHash: await hashKey(plainKey),
      label: label.trim(),
      role: 'user',
      status: status === 'disabled' ? 'disabled' : 'active',
      createdAt: now,
      expiresAt: expires,
      lastUsedAt: null,
    };

    const result = await db.collection('access_keys').insertOne(doc);

    // Return the plain key ONLY once at creation time
    return res.status(201).json({
      success: true,
      key: {
        id: result.insertedId.toString(),
        label: doc.label,
        role: doc.role,
        status: doc.status,
        createdAt: now,
        expiresAt: expires,
        // Plain key shown only here
        plainKey,
      },
      message: 'User key created. Save the key now — it will not be shown again.',
    });
  } catch (err) {
    console.error('Generate key error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to generate user key',
    });
  }
};
