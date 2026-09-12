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

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const pageRoutes = require('./routes/pages');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;
const isVercel = !!process.env.VERCEL;

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true
}));

if (!isVercel) {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isVercel ? '7d' : 0
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---- Mongo connection (lazy, safe for serverless) ----
let mongoReady = null;
function connectMongo() {
  if (!process.env.MONGODB_URI) {
    return Promise.resolve(false);
  }
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(true);
  }
  if (mongoReady) return mongoReady;

  mongoReady = mongoose
    .connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    })
    .then(() => {
      console.log('[DB] Connected to MongoDB');
      return true;
    })
    .catch((err) => {
      console.error('[DB] Connection failed:', err.message);
      mongoReady = null;
      return false;
    });

  return mongoReady;
}

// Ensure DB before handling requests that need it
app.use(async (req, res, next) => {
  try {
    await connectMongo();
  } catch (e) {
    console.error('[DB middleware]', e.message);
  }
  next();
});

// Session
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'samapi-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: isVercel || process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: isVercel || process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
};

if (process.env.MONGODB_URI) {
  try {
    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60,
      autoRemove: 'native',
      touchAfter: 24 * 3600
    });
  } catch (e) {
    console.warn('[Session] MongoStore init failed, using MemoryStore:', e.message);
  }
}

app.use(session(sessionConfig));

try {
  configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());
} catch (e) {
  console.error('[Passport] Init failed:', e.message);
}

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: 'Too many requests, please try again later.' }
});
app.use(publicLimiter);

// Warm manifest in memory (no disk write on Vercel)
try {
  generateManifest();
} catch (e) {
  console.warn('[Scanner]', e.message);
}

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

app.use(authRoutes);
app.use('/api', apiRoutes);
app.use(pageRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: '404 — Page Not Found',
    user: req.user
  });
});

app.use((err, req, res, next) => {
  console.error('[Server Error]', err && (err.stack || err.message || err));
  const status = err.status || 500;
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(status).json({
      status: false,
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : String(err.message || err)
    });
  }
  try {
    res.status(status).render('errors/500', {
      title: 'Server Error',
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong.' : String(err.message || err),
      user: req.user
    });
  } catch (e) {
    res.status(500).send('Internal Server Error');
  }
});

// Local only
if (!isVercel) {
  connectMongo().then(() => {
    app.listen(PORT, () => {
      console.log(`[SamApi] Server running on port ${PORT}`);
      console.log(`[SamApi] Auth: Google OAuth`);
    });
  });
}

module.exports = app;
