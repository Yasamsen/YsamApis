const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/mongodb');

module.exports = async function editKey(req, res) {
  try {
    const { id } = req.params;
    const { label, expiresAt, status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid key ID' });
    }

    const db = getDb();
    const existing = await db.collection('access_keys').findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Key not found' });
    }

    const updates = {};

    if (label !== undefined) {
      if (typeof label !== 'string' || label.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid label',
          message: 'Label cannot be empty',
        });
      }
      updates.label = label.trim();
    }

    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === 'never' || expiresAt === '') {
        updates.expiresAt = null;
      } else {
        const d = new Date(expiresAt);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ success: false, error: 'Invalid expiration date' });
        }
        updates.expiresAt = d;
      }
    }

    if (status !== undefined) {
      if (status !== 'active' && status !== 'disabled') {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No changes',
        message: 'Nothing to update',
      });
    }

    updates.updatedAt = new Date();

    const result = await db.collection('access_keys').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );

    return res.json({
      success: true,
      key: {
        id: result._id.toString(),
        label: result.label,
        role: result.role,
        status: result.status,
        createdAt: result.createdAt,
        expiresAt: result.expiresAt,
        lastUsedAt: result.lastUsedAt,
      },
    });
  } catch (err) {
    console.error('Edit key error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to edit key',
    });
  }
};
