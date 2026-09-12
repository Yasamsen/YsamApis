const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/mongodb');

module.exports = async function renameFile(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid file ID' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid name',
        message: 'File name is required',
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Name too long',
        message: 'File name must be 255 characters or less',
      });
    }

    const db = getDb();
    const result = await db.collection('files').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name: trimmedName, updatedAt: new Date() } },
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
        size: result.size,
        mimeType: result.mimeType,
        folderId: result.folderId ? result.folderId.toString() : null,
        updatedAt: result.updatedAt,
      },
    });
  } catch (err) {
    console.error('Rename file error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to rename file',
    });
  }
};
