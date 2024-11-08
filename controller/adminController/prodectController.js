const Product = require('../../model/prodectSchema');
const Category = require('../../model/Category')
const path = require('path');


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


    const product = new Product({
      name,
      price,
      category,
      stock,
      discount,
      status,
      description,
      images: imagePaths 
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


exports.updateProductPost = async (req, res) => {
    const productId = req.params.id;
    const deletedImages = JSON.parse(req.body.deletedImages || '[]');
    const croppedImages = req.files;

    try {
        let product = await Product.findById(productId);
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products');
        }

        // Update product fields
        Object.assign(product, req.body);

        // Handle deleted images
        if (deletedImages.length > 0) {
            product.images = product.images.filter(img => !deletedImages.includes(img));

            deletedImages.forEach(image => {
                const filePath = path.join('uploads', image);
                // if (fs.existsSync(filePath)) {
                //     fs.unlinkSync(filePath);
                // }
            });
        }

        // Handle new cropped images
        if (croppedImages && croppedImages.length > 0) {
            croppedImages.forEach(file => {
                product.images.push(file.filename);
            });
        }

        await product.save();
        req.flash('success_msg', 'Product updated successfully');
        return res.redirect('/admin/products'); 
    } catch (err) {
        console.error(err);
        if (!res.headersSent) {
            req.flash('error_msg', 'Server Error');
            return res.status(500).redirect('/admin/products');
        }
    }
};




exports.deleteproduct = async (req, res) => {
    try {  
        const { id } = req.params;
        const product = await Product.findById(id); 

        if (!product) {
            return res.status(404).send('Product not found'); 
        }

        product.isDeleted = true; 
        await product.save(); 

        res.redirect('/admin/products'); 
    } catch (error) {
        console.error(error); 
        res.status(500).send('Server error'); 
    }
};

