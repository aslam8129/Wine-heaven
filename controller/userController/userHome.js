
require('dotenv').config();
const Product = require('../../model/prodectSchema');
const Categories = require('../../model/Category');
const Cart = require('../../model/cartSchema')
exports.home = async (req, res) => {
    try {
        const categories = await Categories.find({ isDeleted: false, isBlocked: false });

        
        const products = await Product.find({ isDeleted: false,isBlocked:false }).limit(8);

      
        return res.render('user/home', {
            categories,
            products,
            showAllButton: true, 
        });
    } catch (error) {
        console.error('Error rendering home page:', error);
        req.flash('error', 'Something went wrong. Please try again later.');
        return res.redirect('/login');
    }
};





exports.Getcategories = async (req, res) => {
    try {
        const { id } = req.params;
        const products = await Product.find({  category: id,isDeleted:false }).populate('category');
        const category = await Categories.find({isBlocked:false,isBlocked:false})
        res.render('user/category', { products,category });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
};



exports.Getproducts = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;
        const product = await Product.findById(id).populate('category');
        const products = await Product.find({ isDeleted: false,isBlocked:false, category: product.category._id, _id: { $ne: id } });
        const cart = await Cart.findOne({ userId });

        // Assuming each cart item has a 'productId' field
        const isInCart = cart ? cart.items.some(item => item.productId.toString() === id) : false;

        if (!product) {
            return res.redirect('/');
        }
        res.render('user/product', { product, products, isInCart });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
};


exports.Allproducts = async (req, res) => {
    try {
       
        const sortOption = req.query.sort || 'priceAsc';
        let sortField = {};

        switch (sortOption) {
            case 'priceAsc':
                sortField = { price: 1 };
                break;
            case 'priceDesc':
                sortField = { price: -1 };
                break;
            case 'nameAsc':
                sortField = { name: 1 };
                break;
            case 'nameDesc':
                sortField = { name: -1 };
                break;
        }

      
        const query = req.query.search || '';
        let searchCriteria = { isDeleted: false ,isBlocked:false};

        if (query) {
            searchCriteria = {
                ...searchCriteria,
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ]
            };
        }

       
        const category = req.query.category || '';
        if (category) {
            searchCriteria.category = category;
        }

       
        const categories = await Categories.find({ isBlocked: false, isDeleted: false });

        
        const products = await Product.find(searchCriteria).sort(sortField).exec();

      
        res.render('user/Allproducts', { 
            products, 
            query, 
            sortOption, 
            categories, 
            categoryQuery: category 
        });
    } catch (error) {
        console.log(`Error in Allproducts: ${error}`);
        res.status(500).send('Internal Server Error');
    }
};
