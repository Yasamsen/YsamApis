const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/mongodb');

module.exports = async function renameFolder(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid folder ID' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid name',
        message: 'Folder name is required',
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Name too long',
        message: 'Folder name must be 255 characters or less',
      });
    }

    const db = getDb();
    const folder = await db.collection('folders').findOne({ _id: new ObjectId(id) });
    if (!folder) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    // Check duplicate name in same parent
    const existing = await db.collection('folders').findOne({
      name: trimmedName,
      parentId: folder.parentId,
      _id: { $ne: new ObjectId(id) },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Folder already exists',
        message: 'A folder with this name already exists in this location',
      });
    }

    const result = await db.collection('folders').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name: trimmedName, updatedAt: new Date() } },
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
    console.error('Rename folder error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to rename folder',
    });
  }
};
