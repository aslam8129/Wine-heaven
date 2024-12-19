
require('dotenv').config();
const Product = require('../../model/prodectSchema');
const Categories = require('../../model/Category');
const Cart = require('../../model/cartSchema');
const Wishlist = require('../../model/whishlist')
const User = require('../../model/userSchema')
const bcrypt = require('bcryptjs')
const Offer = require('../../model/offerSchema')
exports.home = async (req, res) => {
    try {

        const categories = await Categories.find({ isDeleted: false, isBlocked: false });


        const products = await Product.find({ isDeleted: false, isBlocked: false })
            .populate('category')
            .limit(8);


        const validProducts = products.filter(product => product.category && !product.category.isBlocked && !product.category.isDeleted);
        const offers = await Offer.find({ isActive: true })
        .populate('offerCategory')
        .populate('offerProduct');

        return res.render('user/home', {
            categories,
            products: validProducts,
            showAllButton: true,
            offers
        });
    } catch (error) {

        req.flash('error', 'Something went wrong. Please try again later.');
        return res.redirect('/login');
    }
};





exports.Getcategories = async (req, res) => {
    try {
        const { id } = req.params;
        const products = await Product.find({ category: id, isDeleted: false }).populate('category');
        const category = await Categories.find({ isBlocked: false, isBlocked: false })
        res.render('user/category', { products, category });
    } catch (error) {

        res.redirect('/');
    }
};


exports.Getproducts = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;


        const product = await Product.findOne({ _id: id, isDeleted: false, isBlocked: false }).populate('category');

        if (!product) {

            return res.redirect('/');
        }


        const products = await Product.find({
            isDeleted: false,
            isBlocked: false,
            category: product.category._id,
            _id: { $ne: id },
        });

        const cart = await Cart.findOne({ userId });
        const wishlist = await Wishlist.findOne({ userId });

        const isInCart = cart ? cart.items.some(item => item.productId.toString() === id) : false;

        const validProducts = products.filter(product => product.category && !product.category.isBlocked && !product.category.isDeleted);

        res.render('user/product', { product, products: validProducts, isInCart });
    } catch (error) {

        res.redirect('/');
    }
};


exports.Allproducts = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skipIndex = (page - 1) * limit;


        const searchQuery = req.query.search || '';


        const categoryFilter = req.query.category ? { category: req.query.category } : {};

        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || Infinity;


        const sortOptions = {
            'priceAsc': { price: 1 },
            'priceDesc': { price: -1 },
            'nameAsc': { name: 1 },
            'nameDesc': { name: -1 },
            'default': { createdAt: -1 }
        };
        const sortField = sortOptions[req.query.sort] || sortOptions['default'];


        const searchCriteria = {
            isDeleted: false,
            isBlocked: false,
            price: { $gte: minPrice, $lte: maxPrice },
            ...categoryFilter,
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ]
        };


        const categories = await Categories.find({ isBlocked: false, isDeleted: false });

        const totalProducts = await Product.countDocuments(searchCriteria);
        const products = await Product.find(searchCriteria)
            .populate('category')
            .sort(sortField)
            .skip(skipIndex)
            .limit(limit)
            .exec();

        const product = products.filter(product => product.category && !product.category.isBlocked && !product.category.isDeleted)
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('user/Allproducts', {
            products: product,
            categories,
            query: req.query,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalProducts: totalProducts,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {

        res.status(500).render('error', { message: 'Internal Server Error' });
    }
};







exports.cart = async (req, res) => {
    const { productId } = req.body;
    try {
        if (!req.session.userId) {

            return res.status(401).json({ success: false, message: 'User not logged in.' });
        }

        let cart = await Cart.findOne({ userId: req.session.userId }).populate('items.productId');
        const product = await Product.findById(productId);



        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }
        if (product.stock === 0) {
            return res.status(400).json({ success: false, message: 'The product stock left' })
        }

        if (!cart) {
            cart = new Cart({
                userId: req.session.userId,
                items: [],
            });
        }
        const existingProduct = cart.items.find(item => item.productId._id.toString() === productId);
        if (existingProduct) {
            return res.status(400).json({ success: false, message: 'Product already in cart.' });
        }

        cart.items.push({
            productId: product._id,
            productCount: 1,
            productPrice: product.priceAfterDiscount,
            productDiscountPrice: product.priceAfterDiscount - (product.priceAfterDiscount * (product.discount / 100)),
        });

        await cart.save();



        res.status(200).json({ success: true, message: 'Product added successfully' });
    } catch (error) {

        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};



exports.resetPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;

        // Fetch the user from the database
        const user = await User.findById(req.session.userId);

        // Check if the user logged in via Google
        // if (user.googleId) {
        //     req.flash('error', 'You logged in with Google, so you cannot reset a password.');
        //     return res.redirect('/userprofile');
        // }

        // Verify the current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            req.flash('error', 'Current password does not match.');
            return res.redirect('/userprofile');
        }

        // Check if newPassword and confirmNewPassword match
        if (newPassword !== confirmNewPassword) {
            req.flash('error', 'New password and confirm password do not match.');
            return res.redirect('/userprofile');
        }

        // Validate the new password length
        if (newPassword.length < 6) {
            req.flash('error', 'Password must be at least 6 characters long.');
            return res.redirect('/userprofile');
        }

        // Validate password complexity: At least 2 digits and 3 letters
        const numberCount = (newPassword.match(/\d/g) || []).length;
        const letterCount = (newPassword.match(/[a-zA-Z]/g) || []).length;

        if (numberCount < 2 || letterCount < 3) {
            req.flash('error', 'Password must contain at least 2 digits and 3 letters.');
            return res.redirect('/userprofile');
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password in the database
        await User.findByIdAndUpdate(req.session.userId, { password: hashedPassword });

        req.flash('success', 'Password updated successfully');
        res.redirect('/userprofile');
    } catch (error) {
        console.error('Error resetting password:', error);
        req.flash('error', 'An error occurred while resetting the password.');
        res.redirect('/userprofile');
    }
};
