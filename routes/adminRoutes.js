const express = require('express');
const admincontroller = require('../controller/adminController/admincontroller');
const prodectController  = require('../controller/adminController/prodectController')
const isadmin = require('../middlware/admin')
const router = express.Router();
const uploads = require('../config/multer')




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
router.post('/products/delete/:id',prodectController.deleteproduct)

module.exports = router;       