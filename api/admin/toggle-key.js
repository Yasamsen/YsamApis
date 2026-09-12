const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/mongodb');

module.exports = async function toggleKey(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid key ID' });
    }

    const db = getDb();
    const key = await db.collection('access_keys').findOne({ _id: new ObjectId(id) });

    if (!key) {
      return res.status(404).json({ success: false, error: 'Key not found' });
    }

    const newStatus = key.status === 'active' ? 'disabled' : 'active';

    const result = await db.collection('access_keys').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: newStatus, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    return res.json({
      success: true,
      key: {
        id: result._id.toString(),
        label: result.label,
        status: result.status,
      },
    });
  } catch (err) {
    console.error('Toggle key error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to toggle key status',
    });
  }
};
