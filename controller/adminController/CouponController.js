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
    try {
        const coupons = await Coupon.find();
        res.render('admin/coupons', { coupons });
    } catch (error) {
        console.error(error);
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
        console.error(error);
        res.status(500).send('Server error');
    }
};





exports.GetOffers = async (req,res)=>{
try{
const offers = await Offer.find().populate('offerCategory').populate('offerProduct');

res.render('admin/showOffer',{offers})


}catch(error){

}
}


exports.GetAddOffer = async (req,res)=>{
    try{

        const categories = await Category.find({isBlocked:false,isDeleted:false});
        const products = await Product.find({isBlocked:false,isDeleted:false})
res.render('admin/addOffer',{categories,products})
    }catch(error){

    }
}

exports.PostAddOffer = async (req,res)=>{
    try{

        let {offerName,offerCategory,offerProduct,discountPercentage,offerType}= req.body;



        if(offerType = 'product'){
        let offer = new Offer({
            offerName,
            discountPercentage,
            offerProduct,
            offerType
        })


        await offer.save();
    }else{
    let offer = new Offer({
        offerName,
        discountPercentage,
        offerCategory,
        offerType

    })


    await offer.save();
}



        res.redirect('/admin/offers')
          

    }catch(error){
console.log(`error in post offer ${error}`);

    }
}


exports.offerdeactivate = async (req,res)=>{
    try {
        const offerId = req.params.id;


        await Offer.findByIdAndUpdate(offerId, { isActive: true });

   
        const offer = await Offer.findById(offerId);

        if (offer.offerType === 'product') {
         
            await Product.findByIdAndUpdate(
                offer.offerProduct,
                { $inc: { discount: offer.discountPercentage } }
            );
            
        } else {
         
            const category = await Category.findById(offer.offerCategory);
            await Product.updateMany(
                { category: category._id },
                { $inc: { discount: offer.discountPercentage } }
            );
        }

      
        res.redirect('/admin/offers');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while deactivating the offer');
    }
}
exports.offerActivate = async (req, res) => {
    try {
        const offerId = req.params.id;

        await Offer.findByIdAndUpdate(offerId, { isActive: false });

        
        const offer = await Offer.findById(offerId);

        if (offer.offerType === 'product') {
        
            await Product.findByIdAndUpdate(
                offer.offerProduct,
                { $inc: { discount: -offer.discountPercentage } } 
            );
        } else {
            
            const category = await Category.findById(offer.offerCategory);
            await Product.updateMany(
                { category: category._id },
                { $inc: { discount: -offer.discountPercentage } } 
            );
        }

        
        res.redirect('/admin/offers');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while deactivating the offer');
    }
};
