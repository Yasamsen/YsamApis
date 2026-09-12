const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/mongodb');
const { deleteFile } = require('../../lib/storage');

async function deleteFolderRecursive(db, folderId) {
  const oid = new ObjectId(folderId);

  const files = await db.collection('files').find({ folderId: oid }).toArray();
  for (const file of files) {
    try {
      await deleteFile(file.storageKey);
    } catch (err) {
      console.error(`Failed to delete storage object ${file.storageKey}:`, err);
    }
  }
  await db.collection('files').deleteMany({ folderId: oid });

  const subfolders = await db.collection('folders').find({ parentId: oid }).toArray();
  for (const sub of subfolders) {
    await deleteFolderRecursive(db, sub._id.toString());
  }

  await db.collection('folders').deleteOne({ _id: oid });
}

module.exports = async function deleteFolder(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid folder ID' });
    }

    const db = getDb();
    const folder = await db.collection('folders').findOne({ _id: new ObjectId(id) });

    if (!folder) {
      return res.status(404).json({ success: false, error: 'Folder not found' });
    }

    await deleteFolderRecursive(db, id);

    return res.json({
      success: true,
      message: 'Folder and all contents deleted successfully',
    });
  } catch (err) {
    console.error('Delete folder error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete folder',
    });
  }
};
