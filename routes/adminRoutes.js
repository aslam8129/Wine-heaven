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
router.get('/Dashboard',isadmin.adminAuth,admincontroller.dashbordGet)
router.get('/customers',isadmin.adminAuth,admincontroller.listuser)
router.post('/block/:id',admincontroller.blockUser);
router.post('/unblock/:id',admincontroller.unblockUser);
router.get('/logout',admincontroller.adlogout)  



router.get('/products',isadmin.adminAuth,prodectController.listProducts)
router.get('/products/add',isadmin.adminAuth,prodectController.GETaddproduct)
router.post('/products/add',uploads,prodectController.addProductPost);
router.get('/products/edit/:id',isadmin.adminAuth,prodectController.editProductGet)
router.post('/products/edit/:id',uploads, prodectController.updateProductPost)
router.post('/products/block/:id',prodectController.Blockedproduct)






router.get('/orders',ordersList.getAllOrders);
router.post('/update-order-status',ordersList.updateOrderStatus);
router.get('/order/:id',ordersList.getorderDetails)



router.get('/coupons/add', Coupon.getAddCoupon);
router.get('/coupons', Coupon.getAllCoupons);
router.post('/coupons',Coupon.addCoupon);



router.get('/offers',Coupon.GetOffers);
router.get('/offers/add',Coupon.GetAddOffer)
router.post('/offers/add',Coupon.PostAddOffer);
router.post('/offers/deactivate/:id',Coupon.offerActivate)
router.post('/offers/Activate/:id',Coupon.offerdeactivate)





router.get('/sales-report',salesRiport.GetsalesReport)
router.get('/sales-report/download/excel',salesRiport.downloadExcel);
router.get('/sales-report/download/pdf',salesRiport.downloadPDF)
module.exports = router;       