const { getDb } = require('./mongodb');

/**
 * Storage quota and safety checks.
 * Fail-closed: if we cannot determine usage, refuse the operation.
 */

function getStorageLimit() {
  // Prefer STORAGE_LIMIT_BYTES, fallback to R2_STORAGE_LIMIT_BYTES for compatibility
  const limit = process.env.STORAGE_LIMIT_BYTES || process.env.R2_STORAGE_LIMIT_BYTES;
  if (!limit || isNaN(Number(limit)) || Number(limit) <= 0) {
    throw new Error('STORAGE_LIMIT_BYTES (or R2_STORAGE_LIMIT_BYTES) must be set to a positive number');
  }
  return Number(limit);
}

function getMaxFileSize() {
  const max = process.env.MAX_FILE_SIZE_BYTES;
  if (!max || isNaN(Number(max)) || Number(max) <= 0) {
    throw new Error('MAX_FILE_SIZE_BYTES must be set to a positive number');
  }
  return Number(max);
}

/**
 * Calculate total used storage from MongoDB file metadata.
 * This is the source of truth for application quota.
 */
async function getUsedStorage() {
  const db = getDb();
  const result = await db.collection('files').aggregate([
    {
      $group: {
        _id: null,
        totalSize: { $sum: '$size' },
        count: { $sum: 1 },
      },
    },
  ]).toArray();

  if (!result || result.length === 0) {
    return { usedBytes: 0, fileCount: 0 };
  }

  return {
    usedBytes: result[0].totalSize || 0,
    fileCount: result[0].count || 0,
  };
}

async function getStorageStats() {
  const db = getDb();
  const limit = getStorageLimit();

  const used = await getUsedStorage();
  const folderCount = await db.collection('folders').countDocuments();

  // Largest file
  const largest = await db.collection('files')
    .find({})
    .sort({ size: -1 })
    .limit(1)
    .toArray();

  const usedBytes = used.usedBytes;
  const availableBytes = Math.max(0, limit - usedBytes);
  const percentUsed = limit > 0 ? Math.min(100, (usedBytes / limit) * 100) : 0;

  let backend = 'local';
  try {
    backend = require('./storage').getStorageBackendName();
  } catch (_) {}

  return {
    usedBytes,
    availableBytes,
    limitBytes: limit,
    percentUsed: Math.round(percentUsed * 100) / 100,
    fileCount: used.fileCount,
    folderCount,
    largestFile: largest[0]
      ? { name: largest[0].name, size: largest[0].size }
      : null,
    backend,
  };
}

/**
 * Check if a new file of given size can be uploaded.
 * Fail-closed: any error or inability to compute => reject.
 */
async function checkQuotaForUpload(incomingSize) {
  if (typeof incomingSize !== 'number' || incomingSize < 0 || !Number.isFinite(incomingSize)) {
    return {
      allowed: false,
      error: 'Invalid file size',
      message: 'File size is invalid',
    };
  }

  const maxFileSize = getMaxFileSize();
  if (incomingSize > maxFileSize) {
    return {
      allowed: false,
      error: 'File too large',
      message: `File exceeds maximum allowed size of ${formatBytes(maxFileSize)}`,
    };
  }

  let stats;
  try {
    stats = await getStorageStats();
  } catch (err) {
    console.error('Failed to compute storage stats:', err);
    return {
      allowed: false,
      error: 'Storage information temporarily unavailable',
      message: 'Please try again later',
    };
  }

  const estimated = stats.usedBytes + incomingSize;
  if (estimated > stats.limitBytes) {
    return {
      allowed: false,
      error: 'Storage quota exceeded',
      message: 'Not enough storage available',
      usedBytes: stats.usedBytes,
      limitBytes: stats.limitBytes,
      availableBytes: stats.availableBytes,
    };
  }

  if (stats.usedBytes >= stats.limitBytes) {
    return {
      allowed: false,
      error: 'Storage quota exceeded',
      message: 'Storage is full. Delete some files first.',
      usedBytes: stats.usedBytes,
      limitBytes: stats.limitBytes,
      availableBytes: 0,
    };
  }

  return {
    allowed: true,
    usedBytes: stats.usedBytes,
    limitBytes: stats.limitBytes,
    availableBytes: stats.availableBytes,
    estimatedBytes: estimated,
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate required environment variables at startup.
 * Fail hard if critical config is missing.
 */
function validateConfig() {
  const required = [
    'MONGODB_URI',
    'SESSION_SECRET',
    'ADMIN_KEY_HASH',
    'MAX_FILE_SIZE_BYTES',
  ];

  // Storage limit (new name or legacy)
  if (!process.env.STORAGE_LIMIT_BYTES && !process.env.R2_STORAGE_LIMIT_BYTES) {
    required.push('STORAGE_LIMIT_BYTES');
  }

  const backend = (process.env.STORAGE_BACKEND || 'local').toLowerCase().trim();
  if (!['local', 'r2', 'b2'].includes(backend)) {
    throw new Error('STORAGE_BACKEND must be "local", "r2", or "b2"');
  }

  if (backend === 'r2') {
    required.push(
      'R2_ACCOUNT_ID',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET_NAME'
    );
  }

  if (backend === 'b2') {
    required.push(
      'B2_KEY_ID',
      'B2_APPLICATION_KEY',
      'B2_BUCKET_NAME',
      'B2_REGION'
    );
  }

  const missing = required.filter((key) => !process.env[key] || process.env[key].trim() === '');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Application cannot start without proper configuration.'
    );
  }

  // Validate numeric limits
  getStorageLimit();
  getMaxFileSize();

  if (process.env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }

  console.log(`Storage backend: ${backend}`);
  if (backend === 'local') {
    const { getLocalStoragePath } = require('./storage');
    console.log(`Local storage path: ${getLocalStoragePath()}`);
  }
}

module.exports = {
  getStorageLimit,
  getMaxFileSize,
  getUsedStorage,
  getStorageStats,
  checkQuotaForUpload,
  formatBytes,
  validateConfig,
};
