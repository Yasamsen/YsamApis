const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/mongodb');

module.exports = async function deleteKey(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid key ID' });
    }

    const db = getDb();
    const result = await db.collection('access_keys').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Key not found' });
    }

    return res.json({
      success: true,
      message: 'User key deleted successfully',
    });
  } catch (err) {
    console.error('Delete key error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete key',
    });
  }
};
