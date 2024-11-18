exports.adminAuth = (req, res, next) => {
    if (req.session.isAdmin) {
      
      
    } else {
        
       
          res.redirect('/admin/login');
    }
    next();
};


const addressValidation = async (req, res, next) => {
    const { name, address, city, state, pincode } = req.body;
    
    try {
        // Name validation
        if (!name || name.length < 3 || name[0] !== name[0].toUpperCase()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid name format'
            });
        }

        // Address validation
        if (!address || address.length < 5) {
            return res.status(400).json({
                success: false,
                message: 'Address must be at least 5 characters long'
            });
        }

        // City validation
        if (!city || city.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'City must be at least 3 characters long'
            });
        }

        // State validation
        const validStates = ['New York', 'Florida', 'California'];
        if (!state || !validStates.includes(state)) {
            return res.status(400).json({
                success: false,
                message: 'Please select a valid state'
            });
        }

        // Pincode validation
        const pincodePattern = /^[1-9][0-9]{5}$/;
        if (!pincode || !pincodePattern.test(pincode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pincode format'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error during validation'
        });
    }
};
