const User = require('../../model/userSchema');
require('dotenv').config();

const Address = require('../../model/userAddress');






exports.GetuserDeatiolsHome = async (req,res)=>{
    try{
         res.render('user/userdetailsHome')
    }catch(error){
         console.log(`error in GetuserDetiolsHome`);
         
    }
}

// Display user details
exports.GetUserdetails = async (req, res) => {
    try {
      
        const user = await User.findById(req.session.userId);
        
     
        if (!user) {
            console.log('User not found');
            return res.redirect('/login');
        }

        
        const updateSuccess = req.session.updateSuccess;
        delete req.session.updateSuccess; 
        
        res.render('user/user details', { user, updateSuccess });
    } catch (error) {
        console.log(`Error in GetUserdetails: ${error}`);
        res.status(500).send("Internal Server Error");
    }
};


exports.UpdateDetails = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const updateData = {};

     
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;

      
        await User.findByIdAndUpdate(req.session.userId, updateData);

      
        req.session.updateSuccess = true;
        res.redirect('/userprofile');
    } catch (error) {
        console.log(`Error in UpdateDetails: ${error}`);
        res.status(500).send("Internal Server Error");
    }
};



exports.addAddress = async (req,res)=>{
    try{
        const addressId = req.params.id;
        let addressData = null;
            
        if (addressId) {
            addressData = await Address.findById(addressId).exec();
        }
    
        res.render('user/Addaddress', { address: addressData });
    }catch(error){
console.log(`error in addAddress ${error}`);

    }
}

exports.addAddressPost = async (req, res) => {
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
  
      return res.redirect('/addresses');
    } catch (error) {
      
      console.error('Error saving address or user:', error);
      res.status(500).send(error.message);
    }
  };







  exports.getALLaddress = async (req, res) => {
    try {
      const email = req.session.user_email;
  
      if (!email) {
        return res.redirect('/login');  
      }
  
      const user = await User.findOne({ email }).populate('addresses');
  
      if (!user) {
        return res.status(404).send('User not found');
      }
  
  
      const activeAddresses = user.addresses.filter(address => !address.isDeleted); 
  
      if (activeAddresses.length === 0) {
        return res.render('user/showAddress', { addresses: [], showAddAddress: true });
      }
 
      res.render('user/showAddress', { addresses: activeAddresses, showAddAddress: false });
  
    } catch (error) {
      console.log(`Error in getALLaddress: ${error}`);
      res.status(500).send('Something went wrong');
    }
  };
    
  


exports.renderEditAddress = async(req,res)=>{
    try{
       const address = await Address.findById(req.params.id);
       return res.render('user/addressEdit',{address})
    }catch(error){
console.log(`error in renderEditAddress :${error}`);

    }
}


exports.editAddressPost = async (req,res)=>{
    try{
     const addressId = req.params.id;

     await Address.findByIdAndUpdate(addressId,req.body)
        return res.redirect('/addresses');
    }catch(error){
        console.log(`error in editAddressPost :${error}`);
        res.status(500).send("Internal Server Error");
        
    }
}





exports.deleteAddress = async (req, res) => {
  try {  
      const { id } = req.params;
      const address = await Address.findByIdAndDelete(id); 
    

      if (!address) {
          return res.status(404).send('address not found'); 
      }

    

      res.redirect('/addresses'); 
  } catch (error) {
      console.error(error); 
      res.status(500).send('Server error'); 
  }
};


