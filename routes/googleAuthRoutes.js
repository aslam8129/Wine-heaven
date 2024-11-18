const express = require('express');
const passport = require('passport');
const User = require('../model/userSchema');

const router = express.Router();

// Auth route with Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google callback route
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
  async function (req, res) {
    try {
      // After successful login, check if user exists
      const user = await User.findOne({ email: req.user.email });
      if (!user) {
        return res.status(400).send('User not found');
      }

      // Store the user ID in session
      req.session.userId = user._id;
      req.session.user_email = email;
      res.redirect('/'); // Redirect to the home page after login
    } catch (error) {
      console.error('Error during callback:', error);
      res.status(500).send('Server Error');
    }
  });

module.exports = router;
