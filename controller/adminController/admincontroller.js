
const User = require('../../model/userSchema');
require('dotenv').config();



exports.loginGet = async (req, res) => {
  try{
    res.render('admin/Adlogin',);
  }catch(error){
    console.log(`error in adminlogin ${error}`);
    
  }
  
    
};

exports.dashbordGet =async (req,res)=>{
try{
  res.render('admin/dashbord')
}catch(error){
  console.log(error);
  
}
}


exports.loginPost = async (req, res) => {
    const EMAIL = process.env.EMAIL_ADMIN ;
    const PASSWORD = process.env.PASSWORD_ADMIN ;

    try {
        
        if (req.body.email === EMAIL && req.body.password === PASSWORD) {
            req.session.isAdmin = EMAIL;
            return res.render('admin/dashbord'); 
        } else {
            req.flash('error','Password or Email not match')
            return res.redirect('/admin/login');
        }
    } catch (error) {
        console.error('Error during login:', error.message);
        return res.redirect('/admin/login');
    }
};





// List all users
exports.listuser = async (req, res) => {
    try {
      const page = parseInt(req.query.page)||1;
      const limit = 4;
      const skip = (page - 1)*limit;
      const totelusers = await User.countDocuments({})
        const users = await User.find() 
        .skip(skip)
        .limit(limit);
        
        return res.render('admin/users', { users ,currentPage:page,totalPages:Math.ceil(totelusers/limit)});
    } catch (error) {
        console.error('Error fetching users:', error.message);
        return res.render('admin/users');
    }
};


// Block users

exports.blockUser = async (req,res)=>{
  try{
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId,{isBlocked:true});
    res.redirect('/admin/customers');

  }catch(error){
    console.log(error);
    res.status(500).send('An error blocking the user')
  }
};




//Unblock users

exports.unblockUser = async (req,res)=>{
  try{
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId,{isBlocked:false});
    res.redirect('/admin/customers')
  }catch(error){
    console.log(error);
res.status(500).send('An error unblocking the user')    
  }
}


exports.adlogout= async (req,res) => {
  try {
    req.session.destroy((err) => {
     if(err){
      console.log(err)
     }
     res.redirect('/admin/login')
    })
  } catch (error) {
    console.log(error.message)
  }
}

