const router = require('express').Router();
const passport = require('passport');
const User = require('../model/userSchema')

// auth with google
router.get('/google',  passport.authenticate('google', { scope: ['profile', 'email'] })
);
  
  // callback route for google to redirect to
  // hand control to passport to use code to grab profile info
  router.get('/google/callback',  passport.authenticate('google', { failureRedirect: '/' }),
  async function(req, res) {
    // Successful authentication, redirect home.
    const user = await User.findOne({email:req.user.email});
    req.session.userId = user._id;
    res.redirect('/');
  });            
       
module.exports = router;
