const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/mongodb');

module.exports = async function listFolders(req, res) {
  try {
    const db = getDb();
    const { parentId, search, sort = 'name', order = 'asc' } = req.query;

    const query = {};

    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    } else if (parentId === 'root' || !parentId) {
      query.parentId = null;
    } else {
      if (!ObjectId.isValid(parentId)) {
        return res.status(400).json({ success: false, error: 'Invalid parent folder ID' });
      }
      query.parentId = new ObjectId(parentId);
    }

    const sortOption = { name: order === 'desc' ? -1 : 1 };

    const folders = await db.collection('folders')
      .find(query)
      .sort(sortOption)
      .toArray();

    const result = folders.map((f) => ({
      id: f._id.toString(),
      name: f.name,
      parentId: f.parentId ? f.parentId.toString() : null,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));

    return res.json({ success: true, folders: result });
  } catch (err) {
    console.error('List folders error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to list folders',
    });
  }
};
