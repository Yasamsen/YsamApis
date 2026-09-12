require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const configurePassport = require('./config/passport');
const { generateManifest, getManifest } = require('./utils/scanner');
const { ensureAuthenticated, ensureAdmin, ensureGuest } = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const pageRoutes = require('./routes/pages');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (for Vercel / reverse proxies)
app.set('trust proxy', 1);

// Security
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for simplicity in this stack
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.BASE_URL || true,
  credentials: true
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'samapi-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
};

if (process.env.MONGODB_URI) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60,
    autoRemove: 'native'
  });
}

app.use(session(sessionConfig));

// Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Global rate limit for public pages
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: 'Too many requests, please try again later.' }
});
app.use(publicLimiter);

// Make user + manifest available to all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.currentPath = req.path;
  res.locals.baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  try {
    res.locals.manifest = getManifest();
  } catch (e) {
    res.locals.manifest = { total: 0, online: 0, endpoints: [], categories: [] };
  }
  next();
});

// Routes
app.use(authRoutes);
app.use('/api', apiRoutes);
app.use(pageRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: '404 — Page Not Found',
    user: req.user
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const status = err.status || 500;
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(status).json({
      status: false,
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
  }
  res.status(status).render('errors/500', {
    title: 'Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message,
    user: req.user
  });
});

// Connect DB and start
async function start() {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('[DB] Connected to MongoDB');
    } else {
      console.warn('[DB] MONGODB_URI not set — running without database (auth & API keys will fail)');
    }

    // Generate initial API manifest
    generateManifest();

    app.listen(PORT, () => {
      console.log(`[SamApi] Server running on port ${PORT}`);
      console.log(`[SamApi] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('[Startup] Failed:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
