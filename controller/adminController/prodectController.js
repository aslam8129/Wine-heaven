const Product = require('../../model/prodectSchema');
const Category = require('../../model/Category')
const path = require('path');
const Cart = require('../../model/cartSchema')

const fs = require('fs');
const { log } = require('console');

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
    const { name, price, category, stock, status, description,discount } = req.body;

    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      req.flash('error', 'This product already exists.');
      return res.redirect('/admin/products/add'); 
    }

    if (!req.files || req.files.length < 3) {
      req.flash('error', 'At least 3 images are required.');
      return res.redirect('/admin/products/add');
    }

    const imagePaths = req.files.map(file => file.filename); 
  
    const priceAfterDiscount = price-(discount/ 100) *  price;

    const product = new Product({
      name,
      price,
      category,
      stock,
      status,
      discount,
      description,
      images: imagePaths,
      priceAfterDiscount:priceAfterDiscount, 
    
    });

     
    product.priceAfterDiscount = product.price-(discount/100)*product.price
    
    await product.save();
   
    res.status(200).json({success : true, message : 'Product added successfully'});  
  } catch (error) { 
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
    
    res.status(500).send('Server Error');
}
};




exports.updateProductPost = async (req, res) => {
    const productId = req.params.id;
    const { croppedImages, deletedImages } = req.body;

    // Parse the arrays
    const newImages = JSON.parse(croppedImages || '[]');
    const removedImages = JSON.parse(deletedImages || '[]');
   
    

    try {
        const product = await Product.findById(productId);
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products');
        }

        const price = parseFloat(req.body.price);
        const discount = parseFloat(req.body.discount) || 0;
        const priceAfterDiscount = price - (price * (discount / 100));
       
       
        const updatedFields = {
            name: req.body.name,
            description: req.body.description,
            price: price,
            discount: req.body.discount,
            priceAfterDiscount: priceAfterDiscount,
            category: req.body.category,
            stock: req.body.stock,
            status: req.body.status,
            priceAfterDiscount : product.price - (product.productAllDiscount/100)*product.price 
        };
       
        

        Object.assign(product, updatedFields);

    
      product.productAllDiscount = product.discount+product.offerDiscout||0
        product.priceAfterDiscount = product.price - (product.productAllDiscount/100)*product.price  
        
        
        
        await product.save();

   
        if (product.isModified('priceAfterDiscount')) {
            await updateCartsWithNewPrice(productId, priceAfterDiscount);
        }

        req.flash('success_msg', 'Product updated successfully');
        return res.redirect('/admin/products');

    } catch (error) {
       
        
        if (newImages.length > 0) {
            for (const file of newImages) {
                try {
                    const filePath = path.join(__dirname, '../uploads', file.filename);
                    if (fs.existsSync(filePath)) {
                        await fs.promises.unlink(filePath);
                    }
                } catch (err) {
                  
                }
            }
        }

        req.flash('error_msg', 'Error updating product. Please try again.');
        return res.redirect(`/admin/products/edit/${productId}`);
    }
};


async function updateCartsWithNewPrice(productId, newPrice) {
    try {
        await Cart.updateMany(
            { "items.productId": productId },
            { 
                $set: { 
                    "items.$.price": newPrice,
                    "items.$.total": { $multiply: ["$items.$.quantity", newPrice] }
                }
            }
        );
    } catch (error) {
        res.status(500).send('Server error'); 
      
    }
}

exports.Blockedproduct = async (req, res) => {
  try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products');
        }

     
        product.isBlocked = !product.isBlocked;
        await product.save();

        req.flash('success_msg', `Product has been ${product.isBlocked ? 'blocked' : 'unblocked'} successfully`);
        res.redirect('/admin/products');
    } catch (error) {
       
        req.flash('error_msg', 'Something went wrong');
        res.redirect('/admin/products');
    }
};

