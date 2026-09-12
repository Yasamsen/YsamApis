const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { getDb } = require('../../lib/mongodb');
const { uploadFile, deleteFile } = require('../../lib/storage');
const { checkQuotaForUpload } = require('../../lib/security');

module.exports = async function uploadFileHandler(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
        message: 'Please select a file to upload',
      });
    }

    const file = req.file;
    const folderId = req.body.folderId || null;
    const originalName = file.originalname || 'unnamed';
    const size = file.size;
    const mimeType = file.mimetype || 'application/octet-stream';

    const db = getDb();
    let folderObjectId = null;
    if (folderId && folderId !== 'root' && folderId !== 'null') {
      if (!ObjectId.isValid(folderId)) {
        return res.status(400).json({ success: false, error: 'Invalid folder ID' });
      }
      const folder = await db.collection('folders').findOne({ _id: new ObjectId(folderId) });
      if (!folder) {
        return res.status(404).json({ success: false, error: 'Folder not found' });
      }
      folderObjectId = new ObjectId(folderId);
    }

    // CRITICAL: Quota check BEFORE any upload
    const quotaCheck = await checkQuotaForUpload(size);
    if (!quotaCheck.allowed) {
      return res.status(400).json({
        success: false,
        error: quotaCheck.error,
        message: quotaCheck.message,
        usedBytes: quotaCheck.usedBytes,
        limitBytes: quotaCheck.limitBytes,
        availableBytes: quotaCheck.availableBytes,
      });
    }

    const ext = path.extname(originalName) || '';
    const storageKey = `files/${uuidv4()}${ext}`;

    // Upload to storage backend (local or R2)
    try {
      await uploadFile(storageKey, file.buffer, mimeType);
    } catch (storageErr) {
      console.error('Storage upload failed:', storageErr);
      return res.status(500).json({
        success: false,
        error: 'Upload failed',
        message: 'Failed to store file. Please try again.',
      });
    }

    // Save metadata only after successful storage upload
    const now = new Date();
    const doc = {
      name: originalName,
      storageKey,
      folderId: folderObjectId,
      size,
      mimeType,
      createdAt: now,
      updatedAt: now,
    };

    let insertResult;
    try {
      insertResult = await db.collection('files').insertOne(doc);
    } catch (dbErr) {
      console.error('MongoDB insert failed, cleaning up storage:', dbErr);
      try {
        await deleteFile(storageKey);
      } catch (cleanupErr) {
        console.error('Storage cleanup also failed:', cleanupErr);
      }
      return res.status(500).json({
        success: false,
        error: 'Upload failed',
        message: 'Failed to save file metadata. Please try again.',
      });
    }

    return res.status(201).json({
      success: true,
      file: {
        id: insertResult.insertedId.toString(),
        name: originalName,
        size,
        mimeType,
        folderId: folderObjectId ? folderObjectId.toString() : null,
        createdAt: now,
      },
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Upload failed',
    });
  }
};
