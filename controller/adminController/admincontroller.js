
const User = require('../../model/userSchema');
const Order = require('../../model/orderSchema');
const chort = require('chart.js')
const Product = require('../../model/prodectSchema'); 
const Category = require('../../model/Category'); 
require('dotenv').config();



exports.loginGet = async (req, res) => {
  try{
    res.render('admin/Adlogin',);
  }catch(error){
    console.log(`error in adminlogin ${error}`);
    
  }
  
    
};



exports.dashboardGet = async (req, res) => {
    try {
        // Get current date and selected parameters
        const currentDate = new Date();
        const selectedYear = parseInt(req.query.year) || currentDate.getFullYear();
        const selectedMonth = parseInt(req.query.month) || (currentDate.getMonth() + 1);
        const selectedPeriod = req.query.period || 'daily';

        // Generate date range for the selected month
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0);

        // Daily Sales Data
        const dailySales = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalRevenue: { $sum: "$totalAmount" },
                    totalOrders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Daily User Registrations
        const dailyUsers = await User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalUsers: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top 5 Products
        const topProducts = await Order.aggregate([
            { $unwind: '$items' },
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: '$items.productId',
                    totalQuantity: { $sum: '$items.productCount' },
                    totalRevenue: { $sum: { $multiply: ['$items.productCount', '$items.productPrice'] } }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);

        // Top 5 Categories
        const topCategories = await Order.aggregate([
            { $unwind: '$items' },
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $group: {
                    _id: '$productDetails.category',
                    totalQuantity: { $sum: '$items.productCount' },
                    totalRevenue: { $sum: { $multiply: ['$items.productCount', '$items.productPrice'] } }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);

        const user = await User.find()

        // Generate years and months for dropdowns
        const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);
        const months = Array.from({ length: 12 }, (_, i) => i + 1);

        // Total Statistics
        const totalStats = {
            totalRevenue: dailySales.reduce((sum, day) => sum + day.totalRevenue, 0),
            totalOrders: dailySales.reduce((sum, day) => sum + day.totalOrders, 0),
            totalUsers:user.length 
        };

        // Render Dashboard
        res.render('admin/dashbord', {
            dailySales,
            dailyUsers,
            topProducts,
            topCategories,
            selectedYear,
            selectedMonth,
            selectedPeriod,
            years,
            months,
            totalStats
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).send('Error loading dashboard');
    }
};






exports.loginPost = async (req, res) => {
    const EMAIL = process.env.EMAIL_ADMIN ;
    const PASSWORD = process.env.PASSWORD_ADMIN ;

    try {
        
        if (req.body.email === EMAIL && req.body.password === PASSWORD) {
            req.session.isAdmin = EMAIL;
            return res.redirect('/admin/Dashboard'); 
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

