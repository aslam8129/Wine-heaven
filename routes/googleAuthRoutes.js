const express = require('express');
const passport = require('passport');
const User = require('../model/userSchema');

const router = express.Router();


router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
async function (req, res) {
  try {
   
    req.session.user_email = req.user.email;

    
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.redirect('/signup'); 
    }

    
    if (user.isBlocked) {
      req.flash('error','Your account has been blocked.');
      return res.redirect('/login?error=blocked'); 
    }

 
    req.session.userId = user._id;

    res.redirect('/');
  } catch (error) {
    console.error('Error during callback:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
