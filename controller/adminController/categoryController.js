const Category = require('../../model/Category');
const path = require('path');
const fs = require('fs')
const {cloudinary} = require('../../config/cloudinaryConfig')





exports.listCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 3; 
        const skip = (page - 1) * limit; 
        
        const totalCategories = await Category.countDocuments({ isDeleted: false });
        const categories = await Category.find({ isDeleted: false })
            .skip(skip)
            .limit(limit);

        res.render('admin/Categories', {
            categories,
           
            currentPage: page,
            totalPages: Math.ceil(totalCategories / limit),
            
        }) 
    } catch (error) {
        res.status(500).send('server error');
    }
};


exports.renderAddpage = (req,res)=>{
return res.render('admin/addCategories')
}



exports.addCategory = async (req, res) => {
    try {
        const { name, croppedImage } = req.body;

        
        if (!name || !croppedImage) {
            req.flash('error', 'Please provide all required fields.');
            return res.redirect('/category/add'); 
        }

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            req.flash('error', 'This category already exists.');
            return res.redirect('/category/add');
        }

        // Handle new cropped image upload
        let imageUrl = '';
        if (croppedImage) {
            const base64Data = croppedImage.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            const tmpFilePath = path.join(__dirname, '../../public/uplods', `${Date.now()}.png`);

            // Save the image temporarily to upload to Cloudinary
            fs.writeFileSync(tmpFilePath, buffer);

            // Upload to Cloudinary
            try {
                const result = await cloudinary.uploader.upload(tmpFilePath);
                imageUrl = result.secure_url;

                // Remove the temporary file
                fs.unlinkSync(tmpFilePath);
            } catch (uploadError) {
            
                console.error(`Error uploading to Cloudinary: ${uploadError}`);
                req.flash('error', 'Error uploading image. Please try again.');
                return res.redirect('/category/add');
            }
        }

        
        const category = new Category({
            name,
            imageUrl, 
        });

        await category.save();
        
        req.flash('success', 'Category added successfully!');
        return res.redirect('/category');
    } catch (error) {
        console.log(`Error in addCategory: ${error}`);
        req.flash('error', 'An error occurred while adding the category. Please try again.');
        return res.redirect('/category/add'); 
    }
};





exports.renderEditpage = async(req,res)=>{
    try{
      const category = await Category.findById(req.params.id);
      if(!category||category.isDeleted){
        return res.status(404).send('Category not found');
      }
      res.render('admin/editCategory',{category})
    }catch(error){
   console.log(`render editpage error : ${error}`);
   
    }
}





exports.editCategory = async (req, res) => {
    try {
        const { id } = req.params; 
        const { name, croppedImage, deleteImage } = req.body; 

        const category = await Category.findById(id); 
        if (!category) {
            req.flash('error', 'Category not found.');
            return res.redirect('/category'); 
        }

        
        category.name = name || category.name;

        // Handle image deletion
        if (deleteImage === "true") {
            if (category.imageUrl) {
                
                await cloudinary.uploader.destroy(category.imageUrl); 
                category.imageUrl = null; 
            }
        }

        
        if (croppedImage) {
            const base64Data = croppedImage.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            const tmpFilePath = path.join(__dirname, '../../public/uplods', `${Date.now()}.png`); 

            // Save the image temporarily to upload to Cloudinary
            fs.writeFileSync(tmpFilePath, buffer);

            const result = await cloudinary.uploader.upload(tmpFilePath);
            category.imageUrl = result.secure_url;

            // Remove the temporary file
            fs.unlinkSync(tmpFilePath);
        }

        await category.save(); 

        req.flash('success', 'Category updated successfully!'); 
        return res.redirect('/category'); 
    } catch (error) {
        console.log(`error in editCategory post :${error}`); 
        req.flash('error', 'Server Error'); 
        return res.redirect('/category'); 
    }
};





exports.deleteCategory = async(req,res)=>{
    try{
     const {id} = req.params;
     const category = await Category.findById(id);
     category.isDeleted = true;
     await category.save();
     res.redirect('/category')
    }catch(error){
     console.log(`deleteCategory error :${error}`);
     
    }
};


// Block category

exports.blockCategory = async (req,res)=>{
  try{
    const categoryId = req.params.id;
    await Category.findByIdAndUpdate(categoryId,{isBlocked:true});
    res.redirect('/category');

  }catch(error){
    console.log(`error in blockCategory :${error}`);
    
  }
};





//Unblock users

exports.unblockCategory = async (req,res)=>{
  try{
    const categoryId = req.params.id;
    await Category.findByIdAndUpdate(categoryId,{isBlocked:false});
    res.redirect('/category')
  }catch(error){
    console.log(`error in unblockCategory :${error}`);
  
  }
}