const express = require('express');
const router = express.Router();
const authController = require('../controller/userController/usercontroller');
const userHome = require('../controller/userController/userHome')
const userDetails = require('../controller/userController/userDetails')
const addToCart = require('../controller/userController/addToCart')
const Order = require('../controller/userController/ordercontroller') ;
const isuser = require('../middlware/user')
const inlogin = require('../middlware/userr')
const wishlist = require('../controller/userController/wishlist')
const paymentController = require('../controller/userController/paymentController')
const invoice = require('../controller/userController/invoice');
const faildPayment = require('../controller/userController/paymentFailedController')


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
router.get('/about',isuser,authController.aboutpage)
router.get('/contact',isuser,authController.contactpage)



router.get('/categorys/:id',isuser, userHome.Getcategories);
router.get('/products/:id',isuser,userHome.Getproducts); 
router.get('/',isuser,inlogin.blockuser,userHome.home);
router.get('/wines',isuser,userHome.Allproducts)
router.post('/cartt',userHome.cart)




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
 router.post('/cart/update',isuser,addToCart.updateQuantity);
router.post('/cart/remove',isuser,addToCart.removeFromCart)
router.get('/checkout',isuser,inlogin.ensureAuthenticated,addToCart.getcheckout)
router.post('/placeOrder/:address/:payment',isuser,paymentController.placeOrder)
router.get('/newaddress',isuser,inlogin.ensureAuthenticated,Order.checkAddaddress);
router.post('/add-addres',Order.checkaddAddressPost);
router.get('/editAddress/:id',isuser,inlogin.ensureAuthenticated,Order.renderEditAddrescheckout);
router.post('/address/edit/:id',Order.editAddressPostcheckout)

// router.post('/wishlist',wishlist.updateWishlist);
router.get('/wishlist',isuser,wishlist.renderWishlistPage)
 router.post('/wishlist/remove',wishlist.postWishlist)
 router.post('/wishlistt',wishlist.updateWishlistt)





 router.post('/payment-render/:totalAmount',paymentController.initiatePayment);
router.post('/api/place-order',paymentController.placeOrder)
router.post('/api/verify-payment',paymentController.verifyPayment)
router.get('/order-confirmation',isuser,paymentController.getorder)
 router.get('/payment-failed',isuser,paymentController.getorderfail)
router.post('/api/coupons/validate',paymentController.validateCoupon)
router.post('/payment-failed',Order.faied);
router.get('/api/order/:orderId',faildPayment.paymentFaildOrderId)
router.post('/api/place-pending-order',faildPayment.updateOrder)






router.get('/orders',isuser,Order.order);
router.get('/orders/:id',isuser,Order.ordersList)
router.get('/sales-report/download/pdf',invoice.downloadPDF)
router.post('/orders/cancel',paymentController.cancelOrder)
router.post('/orders/return',paymentController.returnOrder)
router.get('/wallet',isuser,Order.getWallet)


module.exports = router;
   