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

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || '';
          const adminEmail = (process.env.ADMIN_EMAIL || 'yasampreset@gmail.com').toLowerCase();
          const isAdmin = email.toLowerCase() === adminEmail;

          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // Update profile info and ensure admin status
            user.name = profile.displayName || user.name;
            user.avatar = (profile.photos && profile.photos[0] && profile.photos[0].value) || user.avatar;
            user.email = email || user.email;

            if (isAdmin) {
              user.role = 'admin';
              user.unlimited = true;
              user.dailyLimit = 999999;
            }

            // Ensure API key exists
            if (!user.apiKey) {
              user.apiKey = User.generateApiKey();
            }

            await user.save();
            return done(null, user);
          }

          // Create new user
          const apiKey = User.generateApiKey();
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName || 'User',
            email: email,
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
