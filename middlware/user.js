
// const User = require('../model/userSchema')
// const session = require('express-session');
// const flash = require('connect-flash');
// exports.userActive = (req, res, next) => {
//     if (req.session.userId) {
//        return next();
//     }else{
//         return res.redirect('/login')
//     }
 
   
// };





// // Ensure user ID exists in the session for protected routes
// exports.ensureAuthenticated = (req, res, next) => {
//     if (req.session.userId) {
//         return next(); // Continue if session is valid
//     }
//     req.flash('error', 'You need to be logged in to access this page.');
//     res.redirect('/login');
// };



const User = require('../model/userSchema');




const loadUser = async (req, res, next) => {
    try {
        if (req.session.userId) {
            const user = await User.findById(req.session.userId);
            if (user) {
                res.locals.user = {
                    name: user.name,
                    email: user.email,
                    _id: user._id
                    // Add other user properties you need
                };
            }
        }
        next();
    } catch (error) {
        console.error('Error loading user:', error);
        next();
    }
};




module.exports = loadUser;