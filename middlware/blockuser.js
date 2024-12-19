const User = require('../model/userSchema');

const blockusercheckAllRouts = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        

        if (user) {
           
    

        if (user.isBlocked) {
        
            return res.redirect('/block'); 
        }
    }

        next();
    } catch (error) {
     
        res.status(500).send("Server error. Please try again later.");
    }
};

module.exports = { blockusercheckAllRouts };
