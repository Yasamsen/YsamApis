const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

/**
 * Storage backend abstraction.
 * STORAGE_BACKEND=local  → local disk
 * STORAGE_BACKEND=r2     → Cloudflare R2
 * STORAGE_BACKEND=b2     → Backblaze B2
 */

function getBackend() {
  const backend = (process.env.STORAGE_BACKEND || 'local').toLowerCase().trim();
  if (!['local', 'r2', 'b2'].includes(backend)) {
    throw new Error('STORAGE_BACKEND must be "local", "r2", or "b2"');
  }
  return backend;
}

function getLocalRoot() {
  const root = process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'data', 'files');
  return path.resolve(root);
}

function ensureLocalDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ---------- LOCAL ----------
async function localUpload(storageKey, buffer) {
  const fullPath = path.join(getLocalRoot(), storageKey);
  ensureLocalDir(fullPath);
  await fsp.writeFile(fullPath, buffer);
  return storageKey;
}

async function localGetStream(storageKey) {
  const fullPath = path.join(getLocalRoot(), storageKey);
  if (!fs.existsSync(fullPath)) {
    const err = new Error('File not found on local storage');
    err.code = 'NOT_FOUND';
    throw err;
  }
  const stat = await fsp.stat(fullPath);
  return {
    stream: fs.createReadStream(fullPath),
    contentType: null,
    contentLength: stat.size,
  };
}

async function localDelete(storageKey) {
  const fullPath = path.join(getLocalRoot(), storageKey);
  try {
    await fsp.unlink(fullPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

async function localExists(storageKey) {
  try {
    await fsp.access(path.join(getLocalRoot(), storageKey));
    return true;
  } catch {
    return false;
  }
}

// ---------- R2 ----------
function getR2() {
  return require('./r2');
}

// ---------- B2 ----------
function getB2() {
  return require('./b2');
}

// ---------- PUBLIC API ----------
async function uploadFile(storageKey, buffer, mimeType) {
  const backend = getBackend();
  if (backend === 'local') return localUpload(storageKey, buffer);
  if (backend === 'r2') return getR2().uploadToR2(storageKey, buffer, mimeType);
  if (backend === 'b2') return getB2().uploadToB2(storageKey, buffer, mimeType);
  throw new Error(`Unknown storage backend: ${backend}`);
}

async function getFileStream(storageKey) {
  const backend = getBackend();
  if (backend === 'local') return localGetStream(storageKey);
  if (backend === 'r2') return getR2().getR2Stream(storageKey);
  if (backend === 'b2') return getB2().getB2Stream(storageKey);
  throw new Error(`Unknown storage backend: ${backend}`);
}

async function deleteFile(storageKey) {
  const backend = getBackend();
  if (backend === 'local') return localDelete(storageKey);
  if (backend === 'r2') return getR2().deleteFromR2(storageKey);
  if (backend === 'b2') return getB2().deleteFromB2(storageKey);
  throw new Error(`Unknown storage backend: ${backend}`);
}

async function fileExists(storageKey) {
  const backend = getBackend();
  if (backend === 'local') return localExists(storageKey);
  if (backend === 'r2') {
    const head = await getR2().headObject(storageKey);
    return !!head;
  }
  if (backend === 'b2') {
    const head = await getB2().headB2Object(storageKey);
    return !!head;
  }
  return false;
}

function getStorageBackendName() {
  return getBackend();
}

function getLocalStoragePath() {
  return getLocalRoot();
}

module.exports = {
  uploadFile,
  getFileStream,
  deleteFile,
  fileExists,
  getStorageBackendName,
  getLocalStoragePath,
  getBackend,
};
