const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/mongodb');
const { getFileStream } = require('../../lib/storage');

module.exports = async function previewFile(req, res) {
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

    const previewable = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
      'application/pdf',
      'text/plain', 'application/json',
    ];

    const mime = (file.mimeType || '').toLowerCase();
    const isPreviewable = previewable.some((p) => mime.startsWith(p) || mime === p);

    if (!isPreviewable) {
      return res.status(400).json({
        success: false,
        error: 'Preview not available',
        message: 'This file type cannot be previewed',
        downloadUrl: `/api/files/download/${id}`,
      });
    }

    const { stream, contentType, contentLength } = await getFileStream(file.storageKey);

    res.setHeader('Content-Type', contentType || file.mimeType || 'application/octet-stream');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);

    stream.pipe(res);
  } catch (err) {
    console.error('Preview error:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to preview file',
      });
    }
  }
};
