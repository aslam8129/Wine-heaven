
const Wishlist = require('../../model/whishlist');
const Product = require('../../model/prodectSchema');



exports.updateWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            req.flash('error', 'Please log in to manage your wishlist');
            return res.redirect('back');
        }


        const product = await Product.findById(productId);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('back');
        }


        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = new Wishlist({
                user: userId,
                products: []
            });
        }


        const productIndex = wishlist.products.findIndex(
            (prod) => prod.toString() === productId
        );

        let action;
        if (productIndex > -1) {
            wishlist.products.splice(productIndex, 1);
            action = 'removed';
        } else {

            wishlist.products.push(productId);
            action = 'added';
        }


        await wishlist.save();


        req.flash(
            'success',
            action === 'added'
                ? 'Product added to your wishlist!'
                : 'Product removed from your wishlist!'
        );

        return res.redirect('back');
    } catch (error) {

        req.flash('error', 'An error occurred while managing your wishlist');
        res.redirect('back');
    }
};



exports.checkWishlistStatus = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({
                message: 'Please login',
                inWishlist: false
            });
        }

        const wishlist = await Wishlist.findOne({
            user: userId,
            products: productId
        });

        res.status(200).json({
            inWishlist: !!wishlist
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error checking wishlist',
            inWishlist: false
        });
    }
};

exports.renderWishlistPage = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect('/login');
        }

        const wishlist = await Wishlist.findOne({ user: userId })
            .populate({
                path: 'products',
                match: {
                    isBlocked: false,
                    isDeleted: false
                },
                populate: {
                    path: 'category',
                    select: 'name'
                }
            })
            .lean();

        const wishlistProducts = wishlist ? wishlist.products.map(product => ({
            ...product,
            firstImage: product.images && product.images.length > 0 ? product.images[0] : 'default.jpg',
            isAvailable: product.status === 'available'
        })) : [];

        res.render('user/wishlist', {
            wishlist: wishlistProducts,
            title: 'My Wishlist',
            hasWishlistItems: wishlistProducts.length > 0
        });
    } catch (error) {

        res.status(500).render('error', {
            message: 'Error loading wishlist',
            error: error.message
        });
    }
};



exports.postWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({
                message: 'Please login to manage wishlist'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }


        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = new Wishlist({
                user: userId,
                products: []
            });
        }


        const productIndex = wishlist.products.findIndex(
            (prod) => prod.toString() === productId
        );

        let action;
        if (productIndex > -1) {

            wishlist.products.splice(productIndex, 1);
            action = 'removed';
        } else {

            wishlist.products.push(productId);
            action = 'added';
        }

        await wishlist.save();

        res.status(200).json({
            message: action === 'added'
                ? 'Product added to wishlist'
                : 'Product removed from wishlist',
            action: action,
            wishlist: wishlist.products
        });

    } catch (error) {

        res.status(500).json({
            message: 'Server error processing wishlist'
        });
    }
};



exports.updateWishlistt = async (req, res) => {
    try {

        const { productId } = req.body;
        const userId = req.session.userId;



        if (!userId) {
            return res.status(401).json({
                message: 'Please login to manage your wishlist',
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = new Wishlist({
                user: userId,
                products: []
            });
        }

        const productIndex = wishlist.products.findIndex(
            (prod) => prod.toString() === productId
        );

        let action;
        if (productIndex > -1) {
            // Remove product if already in the wishlist
            wishlist.products.splice(productIndex, 1);
            action = 'removed';
        } else {
            // Add product to the wishlist
            wishlist.products.push(productId);
            action = 'added';
        }

        await wishlist.save();

        res.status(200).json({
            message: action === 'added'
                ? 'Product added to wishlist'
                : 'Product removed from wishlist',
            action,
        });
    } catch (error) {

        res.status(500).json({
            message: 'An error occurred while managing your wishlist',
        });
    }
};
