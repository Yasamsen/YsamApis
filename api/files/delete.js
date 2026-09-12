const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/mongodb');
const { deleteFile } = require('../../lib/storage');

module.exports = async function deleteFileHandler(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid file ID' });
    }

    const db = getDb();
    const file = await db.collection('files').findOne({ _id: new ObjectId(id) });

    if (!file) {
      return res.status(404).json({ success: false, error: 'File Not Found' });
    }

    try {
      await deleteFile(file.storageKey);
    } catch (storageErr) {
      console.error('Storage delete failed:', storageErr);
      // Continue to remove metadata
    }

    await db.collection('files').deleteOne({ _id: new ObjectId(id) });

    return res.json({
      success: true,
      message: 'File deleted successfully',
      deletedSize: file.size,
    });
  } catch (err) {
    console.error('Delete file error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete file',
    });
  }
};
