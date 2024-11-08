
const User = require('../model/userSchema')
const session = require('express-session');
const flash = require('connect-flash');
exports.userActive = (req, res, next) => {
    if (req.session.userId) {
       return next();
    }else{
        return res.redirect('/login')
    }
 
   
};


exports.userlogin = (req,res,next) =>{
    if(req.session.userId){
        return res.redirect('/')
    }
    return next()
}

exports.blockuser = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (user && user.isBlocked) {
            req.session.destroy((err) => {
                if (err) {
                    console.log(err);
                    return res.redirect('/');
                }
                req.flash('error','Your account has been blocked.')
                return res.redirect('/login');
            });
        } else {
           return  next();
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
}