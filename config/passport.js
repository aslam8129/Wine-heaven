const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const keys = require('../config/keys');
const User = require('../model/userSchema');

module.exports = function(passport) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
      done(null, user);
    });
  });

  passport.use(
    new GoogleStrategy({
      clientID: keys.google.clientID,
      clientSecret: keys.google.clientSecret,
      callbackURL: '/auth/google/callback'
    }, (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value; // Get email from the profile
      const name = profile.displayName; // You can also extract first and last name if needed
      User.findOne({ googleId: profile.id }).then((existingUser) => {
        if (existingUser) {
          done(null, existingUser);
        } else {
          new User({
            googleId: profile.id,
            displayName: name,
            email: email, // Save email
            name: name // Save name
          }).save().then((newUser) => {
            done(null, newUser);
          }).catch(err => {
            console.error('Error saving new user:', err);
            done(err, null);
          });
        }
      });
    }) 
  );
};
