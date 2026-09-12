const { getStorageStats, formatBytes } = require('../../lib/security');
const { getDb } = require('../../lib/mongodb');

module.exports = async function adminStats(req, res) {
  try {
    const stats = await getStorageStats();
    const db = getDb();

    const activeKeys = await db.collection('access_keys').countDocuments({ status: 'active' });
    const disabledKeys = await db.collection('access_keys').countDocuments({ status: 'disabled' });

    let warning = null;
    if (stats.percentUsed >= 100) {
      warning = { level: 'full', message: 'Storage penuh' };
    } else if (stats.percentUsed >= 90) {
      warning = { level: 'critical', message: 'Storage hampir mencapai batas' };
    } else if (stats.percentUsed >= 80) {
      warning = { level: 'warning', message: 'Storage hampir penuh' };
    }

    return res.json({
      success: true,
      storage: {
        usedBytes: stats.usedBytes,
        availableBytes: stats.availableBytes,
        limitBytes: stats.limitBytes,
        percentUsed: stats.percentUsed,
        usedFormatted: formatBytes(stats.usedBytes),
        availableFormatted: formatBytes(stats.availableBytes),
        limitFormatted: formatBytes(stats.limitBytes),
        backend: stats.backend || 'local',
      },
      files: {
        total: stats.fileCount,
        largest: stats.largestFile
          ? {
              name: stats.largestFile.name,
              size: stats.largestFile.size,
              sizeFormatted: formatBytes(stats.largestFile.size),
            }
          : null,
      },
      folders: {
        total: stats.folderCount,
      },
      keys: {
        active: activeKeys,
        disabled: disabledKeys,
      },
      warning,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to load statistics',
    });
  }
};
