/**
 * Permission system for MyStorage
 * All checks are enforced on the backend.
 */

const ADMIN_PERMISSIONS = [
  'read',
  'download',
  'preview',
  'search',
  'upload',
  'delete',
  'rename',
  'move',
  'create_folder',
  'manage_keys',
  'view_stats',
  'change_limit',
];

const USER_PERMISSIONS = [
  'read',
  'download',
  'preview',
  'search',
];

function hasPermission(role, permission) {
  if (role === 'admin') {
    return ADMIN_PERMISSIONS.includes(permission);
  }
  if (role === 'user') {
    return USER_PERMISSIONS.includes(permission);
  }
  return false;
}

function canUpload(role) {
  return hasPermission(role, 'upload');
}

function canDelete(role) {
  return hasPermission(role, 'delete');
}

function canManageKeys(role) {
  return hasPermission(role, 'manage_keys');
}

function canCreateFolder(role) {
  return hasPermission(role, 'create_folder');
}

function canRename(role) {
  return hasPermission(role, 'rename');
}

function canMove(role) {
  return hasPermission(role, 'move');
}

module.exports = {
  ADMIN_PERMISSIONS,
  USER_PERMISSIONS,
  hasPermission,
  canUpload,
  canDelete,
  canManageKeys,
  canCreateFolder,
  canRename,
  canMove,
};
