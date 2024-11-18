const express = require('express');
const router = express.Router();
const authController = require('../controller/userController/usercontroller');
const userHome = require('../controller/userController/userHome')
const userDetails = require('../controller/userController/userDetails')
const addToCart = require('../controller/userController/addToCart')
const Order = require('../controller/userController/ordercontroller') ;
const isuser = require('../middlware/user')
const inlogin = require('../middlware/userr')



router.get('/signup',authController.signupGet);
router.post('/signup', authController.signuppost);
router.get('/verify-otp',authController.otpGet);
router.post('/verify-otp',authController.verifyOtp);
router.post('/resend-otp',authController.resendOtp);
router.get('/login',authController.loginGet);
router.post('/login', authController.loginPost);
router.get('/logout', authController.logout);
router.get('/forgot-password',authController.forgetpassword);
router.post('/forgot-password',authController.forgetpasswordPost)
router.get('/reset-password',authController.resetPasswordGet)
router.post('/reset-password',authController.resentPasswordPost)



router.get('/categorys/:id',isuser, userHome.Getcategories);
router.get('/products/:id',isuser,userHome.Getproducts); 
router.get('/',isuser,inlogin.blockuser,userHome.home);
router.get('/wines',isuser,userHome.Allproducts)




router.get('/profile',isuser,inlogin.ensureAuthenticated,userDetails.GetuserDeatiolsHome)
router.get('/userprofile',isuser,inlogin.ensureAuthenticated,userDetails.GetUserdetails)
router.post("/updateDetails",isuser,userDetails.UpdateDetails)
router.get('/addAddress',isuser,inlogin.ensureAuthenticated,userDetails.addAddress);
router.post('/add-address',isuser,userDetails.addAddressPost)
router.get('/addresses',isuser,inlogin.ensureAuthenticated,userDetails.getALLaddress) 
router.get('/address-edit/:id',isuser,inlogin.ensureAuthenticated,userDetails.renderEditAddress);
router.post('/addres/edit/:id',isuser,userDetails.editAddressPost);
router.post('/address-delite/:id',userDetails.deleteAddress)




router.get('/cart',isuser,addToCart.addtoCartGet)
router.post('/cart/update',addToCart.updateQuantity);
router.post('/cart/remove',addToCart.removeFromCart)
router.get('/checkout',isuser,inlogin.ensureAuthenticated,addToCart.getcheckout)
router.post('/placeOrder',addToCart.placeOrder)
router.get('/newaddress',isuser,inlogin.ensureAuthenticated,Order.checkAddaddress);
router.post('/add-addres',Order.checkaddAddressPost);
router.get('/addres-edit/:id',isuser,inlogin.ensureAuthenticated,Order.renderEditAddrescheckout);
router.post('/address/edit/:id',Order.editAddressPostcheckout)
// address/edit
// newaddress


router.get('/orders',isuser,Order.ordersList);


module.exports = router;
   