const Product = require('../../model/prodectSchema');
const Category = require('../../model/Category')
const path = require('path');
const Cart = require('../../model/cartSchema')

const fs = require('fs')

exports.listProducts = async (req, res) => {
    try {
        const perPage = 3;
        const page = parseInt(req.query.page) || 1;


        const products = await Product.find({ isDeleted: false })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate('category')
    
        const totalProducts = await Product.countDocuments({ isDeleted: false });
        const totalPages = Math.ceil(totalProducts / perPage);

        res.render('admin/product', {
            products,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        res.status(500).send('Server error');
    }
};







exports.GETaddproduct = async (req,res)=>{
  let categories = await Category.find({isDeleted:false,isBlocked:false})
  res.render('admin/addproduct',{categories})
};






exports.addProductPost = async (req, res) => {
  try {
    const { name, price, category, stock, discount, status, description } = req.body;

    
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      req.flash('error', 'This product already exists.');
      return res.redirect('/admin/products/add'); 
    }

    
    if (!req.files || req.files.length < 3) {
      req.flash('error', 'At least 3 images are required.');
      return res.redirect('/admin/products/add');
    }

    // Ensure req.files is an array and get image paths
    console.log('Checking if req.files is an array: ' + Array.isArray(req.files));
    const imagePaths = req.files.map(file => file.filename); 
    console.log('Image paths: ' + imagePaths);
    const priceAfterDiscount =    (discount/ 100) *  price;

    const product = new Product({
      name,
      price,
      category,
      stock,
      discount,
      status,
      description,
      images: imagePaths,
      priceAfterDiscount:priceAfterDiscount 
    });

    await product.save();
    console.log(product); 
    
   
    res.status(200).json({success : true, message : 'Product added successfully'});  
  } catch (error) { 
    console.error(error);
    if (!res.headersSent) {
      res.status(500).send('Server Error'); 
    }
  }
};
   










exports.editProductGet = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    const categories = await Category.find({isBlocked:false,isDeleted:false}); 
    res.render('admin/editProduct', { product, categories });
} catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
}
};



const updateCartsWithNewPrices = async (productId) => {
    const product = await Product.findById(productId);
    if (!product) return;

    const carts = await Cart.find({ 'items.productId': productId });
    for (const cart of carts) {
        for (const item of cart.items) {
            if (item.productId.toString() === productId.toString()) {
                item.productPrice = product.price;
                item.productDiscountPrice = product.priceAfterDiscount;
            }
        }
        await cart.save();
    }
};

exports.updateProductPost = async (req, res) => {
    const productId = req.params.id;
    const deletedImages = JSON.parse(req.body.deletedImages || '[]');
    const croppedImages = req.files; // Assuming you're using multer

    try {
        const product = await Product.findById(productId);
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products');
        }

        // Calculate price after discount
        const { price, discount } = req.body;
        let priceAfterDiscount = price;
        if (discount && discount > 0) {
            priceAfterDiscount = (price * (100 - discount)) / 100;
        }

        // Update all fields from req.body and add priceAfterDiscount
        const updatedFields = {
            ...req.body,
            priceAfterDiscount,
        };
        
        // Update product fields except images
        Object.keys(updatedFields).forEach(key => {
            if (key !== 'images') { // Skip images array as we'll handle it separately
                product[key] = updatedFields[key];
            }
        });

        // Handle deleted images
        if (deletedImages && deletedImages.length > 0) {
            // First, create a backup of current images
            const currentImages = [...product.images];
            
            // Filter out deleted images
            product.images = currentImages.filter(img => !deletedImages.includes(img));

            // Delete physical files
            try {
                deletedImages.forEach(image => {
                    const filePath = path.join(__dirname, '../uploads', image);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                });
            } catch (error) {
                console.error('Error deleting images:', error);
                // Continue execution even if file deletion fails
            }
        }

        // Handle new images
        if (croppedImages && croppedImages.length > 0) {
            const newImageFiles = croppedImages.map(file => file.filename);
            product.images.push(...newImageFiles);
        }

        // Validate that we have exactly 3 images
        if (product.images.length !== 3) {
            req.flash('error_msg', 'Product must have exactly 3 images');
            return res.redirect(`/admin/products/edit/${productId}`);
        }

        // Save the updated product
        await product.save();

        // Update cart prices if necessary
        await updateCartsWithNewPrices(productId);

        req.flash('success_msg', 'Product updated successfully');
        return res.redirect('/admin/products');

    } catch (error) {
        console.error('Error updating product:', error);
        req.flash('error_msg', 'Error updating product');
        return res.redirect('/admin/products');
    }
};

exports.Blockedproduct = async (req, res) => {
  try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products');
        }

        // Toggle the isBlocked status
        product.isBlocked = !product.isBlocked;
        await product.save();

        req.flash('success_msg', `Product has been ${product.isBlocked ? 'blocked' : 'unblocked'} successfully`);
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Something went wrong');
        res.redirect('/admin/products');
    }
};

