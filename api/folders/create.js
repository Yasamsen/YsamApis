const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/mongodb');

module.exports = async function createFolder(req, res) {
  try {
    const { name, parentId } = req.body;

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
    let parentObjectId = null;

    if (parentId && parentId !== 'root' && parentId !== 'null') {
      if (!ObjectId.isValid(parentId)) {
        return res.status(400).json({ success: false, error: 'Invalid parent folder ID' });
      }
      const parent = await db.collection('folders').findOne({ _id: new ObjectId(parentId) });
      if (!parent) {
        return res.status(404).json({ success: false, error: 'Parent folder not found' });
      }
      parentObjectId = new ObjectId(parentId);
    }

    // Prevent duplicate names in same parent
    const existing = await db.collection('folders').findOne({
      name: trimmedName,
      parentId: parentObjectId,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Folder already exists',
        message: 'A folder with this name already exists in this location',
      });
    }

    const now = new Date();
    const doc = {
      name: trimmedName,
      parentId: parentObjectId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('folders').insertOne(doc);

    return res.status(201).json({
      success: true,
      folder: {
        id: result.insertedId.toString(),
        name: trimmedName,
        parentId: parentObjectId ? parentObjectId.toString() : null,
        createdAt: now,
      },
    });
  } catch (err) {
    console.error('Create folder error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create folder',
    });
  }
};
