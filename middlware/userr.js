const User = require('../model/userSchema')

exports.ensureAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next(); 
    }
    req.flash('error', 'You need to be logged in to access this page.');
    res.redirect('/login');
};



exports.blockuser = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (user && user.isBlocked) {
            req.session.destroy((err) => {
                if (err) {
                   
                    return res.redirect('/');
                }
                req.flash('error','Your account has been blocked.')
                return res.redirect('/login');
            });
        } else {
           return  next();
        }
    } catch (error) {
        
        next(error);
    }
}




