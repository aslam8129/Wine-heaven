const adminAuth = async (req, res, next) => {
    try {
     
        if (!req.session.isAdmin) {
            return res.redirect('/admin/login'); // Ensure no further code execution
        }
        next();
    } catch (error) {
        console.error('Error in adminAuth middleware:', error);
        res.status(500).send('Internal Server Error'); // Handle errors gracefully
    }
};

module.exports = adminAuth;

