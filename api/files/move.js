const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/mongodb');

module.exports = async function moveFile(req, res) {
  try {
    const { id } = req.params;
    const { folderId } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid file ID' });
    }

    const db = getDb();
    let targetFolderId = null;

    if (folderId && folderId !== 'root' && folderId !== 'null') {
      if (!ObjectId.isValid(folderId)) {
        return res.status(400).json({ success: false, error: 'Invalid target folder ID' });
      }
      const folder = await db.collection('folders').findOne({ _id: new ObjectId(folderId) });
      if (!folder) {
        return res.status(404).json({ success: false, error: 'Target folder not found' });
      }
      targetFolderId = new ObjectId(folderId);
    }

    const result = await db.collection('files').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { folderId: targetFolderId, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'File Not Found' });
    }

    return res.json({
      success: true,
      file: {
        id: result._id.toString(),
        name: result.name,
        folderId: result.folderId ? result.folderId.toString() : null,
        updatedAt: result.updatedAt,
      },
    });
  } catch (err) {
    console.error('Move file error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to move file',
    });
  }
};
