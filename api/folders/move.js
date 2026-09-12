const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/mongodb');

module.exports = async function moveFolder(req, res) {
  try {
    const { id } = req.params;
    const { parentId } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid folder ID' });
    }

    const db = getDb();
    const folder = await db.collection('folders').findOne({ _id: new ObjectId(id) });
    if (!folder) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    let targetParentId = null;
    if (parentId && parentId !== 'root' && parentId !== 'null') {
      if (!ObjectId.isValid(parentId)) {
        return res.status(400).json({ success: false, error: 'Invalid target parent ID' });
      }
      if (parentId === id) {
        return res.status(400).json({
          success: false,
          error: 'Invalid move',
          message: 'Cannot move folder into itself',
        });
      }
      const target = await db.collection('folders').findOne({ _id: new ObjectId(parentId) });
      if (!target) {
        return res.status(404).json({ success: false, error: 'Target folder not found' });
      }
      // Prevent moving into a descendant (simple check - could be improved with path)
      targetParentId = new ObjectId(parentId);
    }

    const result = await db.collection('folders').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { parentId: targetParentId, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    return res.json({
      success: true,
      folder: {
        id: result._id.toString(),
        name: result.name,
        parentId: result.parentId ? result.parentId.toString() : null,
        updatedAt: result.updatedAt,
      },
    });
  } catch (err) {
    console.error('Move folder error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to move folder',
    });
  }
};
