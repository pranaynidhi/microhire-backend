const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User'); // Adjust path as needed

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/oauth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  // Find or create user in your DB
  let user = await User.findOne({ where: { email: profile.emails[0].value } });
  if (!user) {
    user = await User.create({
      fullName: profile.displayName,
      email: profile.emails[0].value,
      role: 'student', // or 'business', or let user choose later
      emailVerified: true
    });
  }
  return done(null, user);
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: '/api/auth/oauth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
  // Find or create user in your DB
  let user = await User.findOne({ where: { email: profile.emails[0].value } });
  if (!user) {
    user = await User.create({
      fullName: profile.displayName || profile.username,
      email: profile.emails[0].value,
      role: 'student',
      emailVerified: true
    });
  }
  return done(null, user);
}));

module.exports = passport;
