const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

function configurePassport() {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback';

  if (!clientID || !clientSecret) {
    console.error('[Passport] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || '';
          if (!email) {
            return done(new Error('Google account has no email'), null);
          }

          const adminEmail = (process.env.ADMIN_EMAIL || 'yasampreset@gmail.com').toLowerCase();
          const isAdmin = email.toLowerCase() === adminEmail;

          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = await User.findOne({ email: email.toLowerCase() });
          }

          if (user) {
            user.googleId = profile.id;
            user.name = profile.displayName || user.name;
            user.avatar = (profile.photos && profile.photos[0] && profile.photos[0].value) || user.avatar;
            user.email = email.toLowerCase();

            if (isAdmin) {
              user.role = 'admin';
              user.unlimited = true;
              user.dailyLimit = 999999;
            }

            if (!user.apiKey) {
              user.apiKey = User.generateApiKey();
            }

            await user.save();
            return done(null, user);
          }

          const apiKey = User.generateApiKey();
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName || 'User',
            email: email.toLowerCase(),
            avatar: (profile.photos && profile.photos[0] && profile.photos[0].value) || '',
            role: isAdmin ? 'admin' : 'user',
            unlimited: isAdmin,
            dailyLimit: isAdmin ? 999999 : 10,
            apiKey,
            usedToday: 0,
            totalRequests: 0,
            status: 'active',
            lastReset: new Date()
          });

          return done(null, user);
        } catch (err) {
          console.error('[Passport] Auth error:', err);
          return done(err, null);
        }
      }
    )
  );
}

module.exports = configurePassport;
