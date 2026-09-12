const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/mongodb');

module.exports = async function listFiles(req, res) {
  try {
    const db = getDb();
    const { folderId, search, sort = 'name', order = 'asc' } = req.query;

    const query = {};

    if (search && search.trim()) {
      // Partial name search (case-insensitive)
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.name = { $regex: escaped, $options: 'i' };
    } else if (folderId === 'root' || !folderId) {
      query.folderId = null;
    } else {
      if (!ObjectId.isValid(folderId)) {
        return res.status(400).json({ success: false, error: 'Invalid folder ID' });
      }
      query.folderId = new ObjectId(folderId);
    }

    const sortMap = {
      name: { name: order === 'desc' ? -1 : 1 },
      size: { size: order === 'desc' ? -1 : 1 },
      date: { createdAt: order === 'desc' ? -1 : 1 },
      type: { mimeType: order === 'desc' ? -1 : 1 },
    };

    const sortOption = sortMap[sort] || sortMap.name;

    const files = await db.collection('files')
      .find(query)
      .sort(sortOption)
      .toArray();

    const result = files.map((f) => ({
      id: f._id.toString(),
      name: f.name,
      size: f.size,
      mimeType: f.mimeType,
      folderId: f.folderId ? f.folderId.toString() : null,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));

    return res.json({ success: true, files: result });
  } catch (err) {
    console.error('List files error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to list files',
    });
  }
};
