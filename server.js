require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const { connectMongo } = require('./lib/mongodb');
const { validateConfig } = require('./lib/security');
const { requireAuth, requireAdmin, requireUserOrAdmin } = require('./lib/auth');

// API handlers
const authLogin = require('./api/auth/login');
const authLogout = require('./api/auth/logout');
const authSession = require('./api/auth/session');

const filesList = require('./api/files/list');
const filesPreview = require('./api/files/preview');
const filesDownload = require('./api/files/download');
const filesUpload = require('./api/files/upload');
const filesRename = require('./api/files/rename');
const filesDelete = require('./api/files/delete');
const filesMove = require('./api/files/move');

const foldersList = require('./api/folders/list');
const foldersCreate = require('./api/folders/create');
const foldersRename = require('./api/folders/rename');
const foldersDelete = require('./api/folders/delete');
const foldersMove = require('./api/folders/move');

const adminStats = require('./api/admin/stats');
const adminUsers = require('./api/admin/users');
const adminGenerateKey = require('./api/admin/generate-key');
const adminEditKey = require('./api/admin/edit-key');
const adminDeleteKey = require('./api/admin/delete-key');
const adminToggleKey = require('./api/admin/toggle-key');

const app = express();
const PORT = process.env.PORT || 3000;

// Validate config early (will throw if invalid)
try {
  validateConfig();
} catch (err) {
  console.error('Configuration error:', err.message);
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400000, // prune expired every 24h
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'mystorage.sid',
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE_BYTES) || 104857600,
  },
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ========== AUTH ROUTES ==========
app.post('/api/auth/login', authLogin);
app.post('/api/auth/logout', requireAuth, authLogout);
app.get('/api/auth/session', authSession);

// ========== FILES ROUTES ==========
app.get('/api/files/list', requireUserOrAdmin, filesList);
app.get('/api/files/preview/:id', requireUserOrAdmin, filesPreview);
app.get('/api/files/download/:id', requireUserOrAdmin, filesDownload);
app.post('/api/files/upload', requireAdmin, upload.single('file'), filesUpload);
app.patch('/api/files/rename/:id', requireAdmin, filesRename);
app.delete('/api/files/delete/:id', requireAdmin, filesDelete);
app.patch('/api/files/move/:id', requireAdmin, filesMove);

// ========== FOLDERS ROUTES ==========
app.get('/api/folders/list', requireUserOrAdmin, foldersList);
app.post('/api/folders/create', requireAdmin, foldersCreate);
app.patch('/api/folders/rename/:id', requireAdmin, foldersRename);
app.delete('/api/folders/delete/:id', requireAdmin, foldersDelete);
app.patch('/api/folders/move/:id', requireAdmin, foldersMove);

// ========== ADMIN ROUTES ==========
app.get('/api/admin/stats', requireAdmin, adminStats);
app.get('/api/admin/users', requireAdmin, adminUsers);
app.post('/api/admin/generate-key', requireAdmin, adminGenerateKey);
app.patch('/api/admin/edit-key/:id', requireAdmin, adminEditKey);
app.delete('/api/admin/delete-key/:id', requireAdmin, adminDeleteKey);
app.patch('/api/admin/toggle-key/:id', requireAdmin, adminToggleKey);

// ========== PAGE ROUTES ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/storage', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'storage.html'));
});

app.get('/admin', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Access Denied - MyStorage</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0f0f0f; color: #e0e0e0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .box { text-align: center; padding: 2rem; border: 1px solid #333; border-radius: 12px; background: #1a1a1a; }
          h1 { color: #ff6b6b; margin-bottom: 0.5rem; }
          a { color: #6b9fff; }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>403 Forbidden</h1>
          <p>Admin access required</p>
          <p><a href="/storage">Go to My Storage</a></p>
        </div>
      </body>
      </html>
    `);
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/preview', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'preview.html'));
});

// Catch-all for SPA-like behavior / 404
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'Not Found', message: 'API endpoint not found' });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'File exceeds maximum allowed size',
      });
    }
    return res.status(400).json({ success: false, error: 'Upload error', message: err.message });
  }

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

// Start
async function start() {
  try {
    await connectMongo();
    app.listen(PORT, () => {
      console.log(`MyStorage running on http://localhost:${PORT}`);
      console.log(`Storage limit: ${process.env.R2_STORAGE_LIMIT_BYTES} bytes`);
      console.log(`Max file size: ${process.env.MAX_FILE_SIZE_BYTES} bytes`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
