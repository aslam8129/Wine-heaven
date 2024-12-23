const express = require('express');
const categoryController = require('../controller/adminController/categoryController');
const {upload} = require('../config/cloudinaryConfig')
const isAdmin = require('../middlware/admin')
const router = express.Router();


router.get('/',categoryController.listCategories);
router.get('/add',categoryController.renderAddpage)
router.post('/add',upload,categoryController.addCategory)
router.get('/edit/:id',categoryController.renderEditpage)
router.post('/edit/:id',upload,categoryController.editCategory)
router.post('/delete/:id',categoryController.deleteCategory);
router.post('/block/:id',categoryController.blockCategory);
router.post('/unblock/:id',categoryController.unblockCategory);

module.exports = router;
