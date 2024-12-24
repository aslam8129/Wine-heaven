const express = require('express');
const admincontroller = require('../controller/adminController/admincontroller');
const prodectController  = require('../controller/adminController/prodectController')
const isadmin = require('../middlware/admin')
const router = express.Router();
const uploads = require('../config/multer')
const ordersList = require('../controller/adminController/orderController')
const Coupon = require('../controller/adminController/CouponController')
const salesRiport = require('../controller/adminController/salesReports')


router.get('/login',admincontroller.loginGet)
router.post('/Dashboard',admincontroller.loginPost)
router.get('/Dashboard',isadmin,admincontroller.dashboardGet)
//router.get('/dashboard', 
router.get('/customers',isadmin,admincontroller.listuser)
router.post('/block/:id',admincontroller.blockUser);
router.post('/unblock/:id',admincontroller.unblockUser);
router.get('/logout',admincontroller.adlogout)  



router.get('/products',isadmin,prodectController.listProducts)
router.get('/products/add',isadmin,prodectController.GETaddproduct)
router.post('/products/add',uploads,prodectController.addProductPost);
router.get('/products/edit/:id',isadmin,prodectController.editProductGet)
router.post('/products/edit/:id',uploads, prodectController.updateProductPost)
router.post('/products/block/:id',prodectController.Blockedproduct)






router.get('/orders',isadmin,ordersList.getAllOrders);
router.post('/update-order-status',ordersList.updateOrderStatus);
router.get('/order/:id',isadmin,ordersList.getorderDetails)



router.get('/coupons/add',isadmin, Coupon.getAddCoupon);
router.get('/coupons',isadmin, Coupon.getAllCoupons);
router.post('/coupons',Coupon.addCoupon);
router.get('/coupon/delete/:id',isadmin,Coupon.deleteCoupon)



router.get('/offers',isadmin,Coupon.GetOffers);
router.get('/offers/add',isadmin,Coupon.GetAddOffer)
router.post('/offers/add',Coupon.PostAddOffer);
router.post('/offers/deactivate/:id',Coupon.offerActivate)
router.post('/offers/Activate/:id',Coupon.offerdeactivate)
router.post('/offers/Delete/:id',Coupon.deleteOffer)
router.get('/coupon/edit/:id',isadmin,Coupon.getEditCoupon)
router.post('/coupon/edit/:id',Coupon.postEditCoupon)
router.get('/offerEdit/:id',isadmin,Coupon.getEditOffer)
router.post('/offers/edit/:id',Coupon.postEditOffer)





router.get('/sales-report',isadmin,salesRiport.GetsalesReport)
router.get('/sales-report/download/excel',isadmin,salesRiport.downloadExcel);
router.get('/sales-report/download/pdf',isadmin,salesRiport.downloadPDF)
module.exports = router;       