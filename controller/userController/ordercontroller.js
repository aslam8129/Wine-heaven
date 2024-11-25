const Order = require('../../model/orderSchema')
const Cart = require('../../model/cartSchema')
const  Product = require('../../model/prodectSchema')
const   Address = require('../../model/userAddress')
const User = require('../../model/userSchema')
const Wallet = require('../../model/walletModel')



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

    
        if (!userId) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1; 
        const skip = (page - 1) * limit;

        
        const ordersCount = await Order.countDocuments({ userId });

        if (ordersCount === 0) {
            return res.render('user/listOrder', {
                orders: [],
                noOrders: true,
                currentPage: page,
                totalPages: 0,
            });
        }


        const orders = await Order.find({ userId }) .populate('shippingAddress').populate('items.productId')
           
           
            .skip(skip)
            .limit(limit)
            .exec();

    

        const totalPages = Math.ceil(ordersCount / limit);

        
        res.render('user/listOrder', {
            orders,
            noOrders: false,
            currentPage: page,
            totalPages,
            limit,
        });
    } catch (error) {
        console.error(`Error in ordersList: ${error.message}`);
        res.status(500).send('Internal Server Error');
    }
};



exports.getWallet = async (req, res) => {
    try {
        const userId = req.session.userId;
        
     console.log(`userid ${userId}`);
     

        const wallet = await Wallet.findOne({ userID: userId });

        console.log(`wallet  ${wallet}`);
        
        
        if (!wallet) {
            return res.render('user/Wallat', { 
                wallet: { 
                    balance: 0, 
                    transactions: [] 
                },
                message: 'No wallet found. Create your first transaction!'
            });
        }
      
        res.render('user/Wallat', { 
            wallet: wallet,
            error: null,
            message: null
        });

    } catch(error) {
        console.error('Wallet Retrieval Error:', error);
        res.render('user/Wallat', { 
            wallet: { 
                balance: 0, 
                transactions: [] 
            },
            error: 'An error occurred while retrieving wallet information'
        });
    }
}