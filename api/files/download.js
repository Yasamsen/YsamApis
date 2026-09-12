const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/mongodb');
const { getFileStream } = require('../../lib/storage');

module.exports = async function downloadFile(req, res) {
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

    const { stream, contentType, contentLength } = await getFileStream(file.storageKey);

    res.setHeader('Content-Type', contentType || file.mimeType || 'application/octet-stream');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Cache-Control', 'private, no-cache');

    stream.pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to download file',
      });
    }
  }
};
