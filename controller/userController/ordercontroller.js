const Order = require('../../model/orderSchema')
const Cart = require('../../model/cartSchema')
const  Product = require('../../model/prodectSchema')
const   Address = require('../../model/userAddress')
const User = require('../../model/userSchema')










exports.checkAddaddress = async(req,res)=>{
    try{
        const addressId = req.params.id;
        let addressData = null;
            
        if (addressId) {
            addressData = await Address.findById(addressId).exec();
        }
    
        res.render('user/checkAddaddress', { address: addressData });
    }catch(error){
console.log(`error in addAddress ${error}`);

    } 
}



exports.checkaddAddressPost = async (req, res) => {
    try {
     
      const newAddress = new Address();
      Object.assign(newAddress, req.body);
  
    
      await newAddress.save();
  
    
      console.log('New Address saved:', newAddress);
  
      const email = req.session.user_email;
      console.log('User email from session:', email);
  
      const user = await User.findOne({ email });
      console.log('User found:', user);
  
      if (user) {
  
        user.addresses.push(newAddress._id);
        
        console.log('User before save:', user);
    
        await user.save();
        
        console.log('User after save:', user);
      } else {
        console.log('No user found with this email');
      }
  
      return res.redirect('/checkout');
    } catch (error) {
      
      console.error('Error saving address or user:', error);
      res.status(500).send(error.message);
    }
  };


  
  exports.renderEditAddrescheckout = async(req,res)=>{
    try{
       const address = await Address.findById(req.params.id);
       return res.render('user/checkoutAddressEdit',{address})
    }catch(error){
console.log(`error in renderEditAddress :${error}`);

    }
}


exports.editAddressPostcheckout = async (req,res)=>{
    try{
     const addressId = req.params.id;

     await Address.findByIdAndUpdate(addressId,req.body)
        return res.redirect('/checkout');
    }catch(error){
        console.log(`error in editAddressPost :${error}`);
        res.status(500).send("Internal Server Error");
        
    }
}






exports.ordersList = async (req, res) => {
    try {
        const userId = req.session.userId;
        console.log("User ID from session:", userId); 

        if (!userId) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1;
        const ordersCount = await Order.countDocuments({ userId: userId });


        const totalPages = Math.ceil(ordersCount / limit);

        const orders = await Order.find({ userId: userId })
            .populate({
                path: 'items.productId',
                populate: {
                    path: 'category',
                    model: 'Category'
                }
            })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

console.log('odersss   :',orders);


       
        console.log("Orders retrieved:", orders);

        if (!orders || orders.length === 0) {
            return res.render('user/listOrder', { orders: [], noOrders: true, currentPage: page, totalPages: 0 });
        }

        const populatedOrders = orders.map(order => {
            return {
                ...order.toObject(),
                items: order.items.map(item => {
                    return {
                        ...item,
                        productImage: item.productId.imageUrl,
                        productName: item.productId.name,
                        productCategory: item.productId.category ? item.productId.category.name : null,
                        productPrice: item.productId.price,
                        productimages: item.productId.images,
                        productDiscountPrice: item.productId.discount,
                        productcount :item.productId.productcount,
                        
                    };
                })
            };
        });

      

        res.render('user/listOrder', {
            orders: populatedOrders,
            noOrders: false,
            currentPage: page,
            totalPages: totalPages,
            limit,
        });

    } catch (error) {
        console.log(`Error in ordersList: ${error}`);
        res.status(500).send('Internal Server Error');
    }
};


