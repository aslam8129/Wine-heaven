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
router.get('/userdetails',authController.GetuserDeatiolsHome)
router.get('/userprofile',authController.GetUserdetails)
router.post("/updateDetails",authController.UpdateDetails)
router.get('/addAddress',authController.addAddress);
router.post('/add-address',authController.addAddressPost)
router.get('/addresses',authController.getALLaddress) 
router.get('/address-edit/:id',authController.renderEditAddress);
router.post('/addres/edit/:id',authController.editAddressPost)
router.get('/allproducts',authController.Allproducts)

module.exports = router;
   