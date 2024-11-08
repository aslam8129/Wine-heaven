const express = require('express');
const router = express.Router();
const authController = require('../controller/userController/usercontroller');
const checkuser = require('../middlware/user')


router.get('/signup',checkuser.userlogin,authController.signupGet);
router.post('/signup', authController.signuppost);
router.get('/verify-otp',authController.otpGet);
router.post('/verify-otp',authController.verifyOtp);
router.post('/resend-otp',authController.resendOtp);
// router.post('/resend-otp', authController.resendOtp);
router.get('/login',checkuser.userlogin,authController.loginGet);
router.post('/login', authController.loginPost);
router.get('/categorys/:id',checkuser.userActive, authController.Getcategories);
router.get('/products/:id',checkuser.userActive,authController.Getproducts); 
router.get('/',checkuser.blockuser,checkuser.userActive,authController.home);
router.get('/logout', authController.logout);

module.exports = router;
