const Coupon = require('../../model/coupenSchema');
const { validationResult } = require('express-validator');
const Offer = require('../../model/offerSchema')
const Category = require('../../model/Category');
const Product = require('../../model/prodectSchema')

exports.getAddCoupon = async (req, res) => {
    try {
        res.render('admin/addcoupen', { errors: null });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};


exports.getAllCoupons = async (req, res) => {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 5)
    try {
        const coupons = await Coupon.find()
            .skip((page - 1) * limit)
            .limit(limit)

        const totalitem = await Coupon.countDocuments()
        const totalpage = Math.ceil(totalitem / limit)
        res.render('admin/coupons', {
            coupons,
            currentPage: page,
            limit,
            totalpage

        });
    } catch (error) {

        res.status(500).send('Server error');
    }
};

exports.addCoupon = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('admin/addcoupen', { errors: errors.array() });
    }

    try {
        const { code, discountType, discountAmount, minimumPurchase, maximumDiscount, validFrom, validUntil, usageLimit } = req.body;


        if(discountType === 'fixed'){
        
            
            if(minimumPurchase/2<discountAmount){
                req.flash('error', 'The discount amount for fixed type must not exceed 50% of the minimum purchase. ');
                return res.redirect('/admin/coupons/add');
            }

        }


    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
        req.flash('error', 'Coupon code already exists');
        return res.redirect('/admin/coupons/add');
    }



        const coupon = new Coupon({
            code: code.toUpperCase(),
            discountType,
            discountAmount,
            minimumPurchase,
            maximumDiscount,
            validFrom,
            validUntil,
            usageLimit
        });

        await coupon.save();
        res.redirect('/admin/coupons');
    } catch (error) {


        res.status(500).send('Server error');
    }
};




exports.deleteCoupon = async (req, res) => {
    try {


        const { id } = req.params;
        await Coupon.findByIdAndDelete(id)
        res.redirect('/admin/coupons');

    } catch (error) {


    }
}



exports.deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;
        await Offer.findByIdAndDelete(id)
        res.redirect('/admin/offers')

    } catch (error) {


    }
}



exports.GetOffers = async (req, res) => {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 4)
    try {
        const offers = await Offer.find().populate('offerCategory').populate('offerProduct')
            .skip((page - 1) * limit)
            .limit(limit)


        const totalitem = await Offer.countDocuments()
        const totalpage = Math.ceil(totalitem / limit)


        res.render('admin/showOffer', {
            offers,
            currentPage: page,
            limit,
            totalpage

        })


    } catch (error) {
        res.status(500).send('Server error');
    }
}


exports.GetAddOffer = async (req, res) => {
    try {

        const categories = await Category.find({ isBlocked: false, isDeleted: false });
        const products = await Product.find({ isBlocked: false, isDeleted: false })

        res.render('admin/addOffer', { categories, products })
    } catch (error) {
        res.status(500).send('Server error');
    }
}


exports.PostAddOffer = async (req, res) => {
    try {
        let { offerName, offerCategory, offerProduct, discountPercentage, offerType } = req.body;


        let offer;
        if (offerType === 'product') {
            offer = new Offer({
                offerName,
                discountPercentage,
                offerProduct,
                offerType
            });

            await offer.save();

        } else {
            offer = new Offer({
                offerName,
                discountPercentage,
                offerCategory,
                offerType
            });

            await offer.save();

        }



        res.redirect('/admin/offers');
    } catch (error) {

        res.status(500).send('Failed to add offer');
    }
};



exports.offerdeactivate = async (req, res) => {

    try {
        const offerId = req.params.id;


        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).send('Offer not found');
        }

        offer.isActive = true;
        await offer.save();


        if (offer.offerType === 'product') {

            const product = await Product.findById(offer.offerProduct);
            if (product) {
                product.offerDiscout = offer.discountPercentage;
                product.productAllDiscount = product.offerDiscout + product.discount
                if (product.productAllDiscount > 95) {
                    product.productAllDiscount = 95
                }
                let price = product.price * (product.productAllDiscount / 100)
                product.priceAfterDiscount = product.price - price

                await product.save();
            }
        } else if (offer.offerType === 'category') {

            const products = await Product.find({ category: offer.offerCategory });
            products.forEach(async (product) => {
                product.offerDiscout = offer.discountPercentage;
                product.productAllDiscount = product.offerDiscout + product.discount
                let price = product.price * (product.productAllDiscount / 100)


                product.priceAfterDiscount = product.price - price

                await product.save();
            });
        }

        res.redirect('/admin/offers');
    } catch (error) {

        res.status(500).send('An error occurred while activating the offer');
    }
};








exports.offerActivate = async (req, res) => {
    try {
        const offerId = req.params.id;

        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).send('Offer not found');
        }

        offer.isActive = false;
        await offer.save();


        if (offer.offerType === 'product') {
            const product = await Product.findById(offer.offerProduct);
            if (product) {
                product.offerDiscout = 0;
                product.productAllDiscount = product.discount
            
                let price = product.price * (product.productAllDiscount / 100)
                product.priceAfterDiscount = product.price - price
                await product.save();

            }
        } else if (offer.offerType === 'category') {
            const products = await Product.find({ category: offer.offerCategory });
            products.forEach(async (product) => {
                product.offerDiscout = 0;
                product.productAllDiscount = product.discount
     
                let price = product.price * (product.productAllDiscount / 100)
                product.priceAfterDiscount = product.price - price


                await product.save();
            });
        }

        res.redirect('/admin/offers');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while deactivating the offer');
    }
};





exports.getEditCoupon = async (req,res)=>{
   
    
    try{


        const id = req.params.id

        const coupon = await Coupon.findById(id)
      

        res.render('admin/editCoupon',{coupon})


    }catch(error){

    }
}


exports.postEditCoupon = async (req, res) => {
    try {



        const couponid = req.params.id;

        if(req.body.discountType === 'fixed'){
        
            
            if(req.body.minimumPurchase/2<req.body.discountAmount){
                req.flash('error', 'The discount amount for fixed type must not exceed 50% of the minimum purchase. ');
                return res.redirect('back');
            }

        }

        await Coupon.findByIdAndUpdate(couponid,req.body)
        res.redirect('/admin/coupons')
    }catch(error){
        console.log(error);
        
    }
      
};



exports.getEditOffer = async(req,res)=>{
    try{
        const id = req.params.id
        const offer = await Offer.findById(id)

        if(offer.isActive){
            req.flash('error', 'this offer active canot edit. ');
           res.redirect('/admin/offers')
        }

        res.render('admin/editOffer',{offer})

    }catch(error){
console.log(error);

    }
}


exports.postEditOffer = async (req,res)=>{
    try{

        const id = req.params.id


        await Offer.findByIdAndUpdate(id,req.body)

        res.redirect("/admin/offers")

        console.log(req.body);
        

    }catch(error){
console.log(error);

    }
}
