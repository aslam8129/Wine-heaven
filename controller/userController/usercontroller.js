const User = require('../../model/userSchema');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const flash = require('connect-flash');
require('dotenv').config();
const Product = require('../../model/prodectSchema');
const Categories = require('../../model/Category');

// Function to send OTP
async function sendOtp(email, otp) {
    try {
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'OTP Verification',
            text: `Your OTP code is: ${otp}`
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error('Failed to send OTP. Please try again later.');
    }
}





exports.signupGet = (req, res) => {
    try {
        res.render('user/signup');
    } catch (error) {
        console.error('Error rendering signup page:', error);
        req.flash('error', 'Something went wrong. Please try again later.');
        res.redirect('/signup');
    }
 };  





exports.signuppost = async (req, res) => {
    try {
        const { name, email, password } = req.body;

      
        let user = await User.findOne({ email });

        if (user) {
            req.flash('error', 'User already exists');
            return res.redirect('/signup');
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        user = new User({
            name,
            email,
            password: hashedPassword,
            isVerified: false,
            otp: '',
            otpExpires: null
        });

        req.session.user_email = email;
        // await user.save();

        req.flash('success', 'Registration successful. Please verify your email to log in.');

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 300000; // 5 minutes from now
        await sendOtp(email, otp);
        await user.save();
        console.log(otp);

        res.redirect(`/verify-otp`);
    } catch (error) {
        console.error('Error during signup:', error);
        req.flash('error', 'Something went wrong during signup. Please try again.');
        res.redirect('/signup');
    }
};







exports.otpGet = (req, res) => {
    try {
        res.render('user/otp', { email: req.session.user_email });
    } catch (error) {
        res.send('error')
    }
};







exports.verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const email =   req.session.user_email
        // console.log(email);
        const user = await User.findOne({ email });
      

        if (!user) {
            req.flash('error', 'No account associated with this email');
            return res.redirect(`/verify-otp`);
        }

        
        if (user.otp !== otp.trim()) {
            req.flash('error', 'The OTP you entered is incorrect. Please try again.');
            return res.redirect(`/verify-otp`);
        }

        if (user.otpExpires < Date.now()) {
            req.flash('error', 'Your OTP has expired. Please request a new one.');
            return res.redirect(`/verify-otp`);
        }


        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        req.flash('success', 'OTP verified. You can now log in.');
        res.redirect('/login');
    } catch (error) {
        console.error('Error verifying OTP:', error);
        req.flash('error', 'Something went wrong during OTP verification. Please try again.');
        res.redirect(`/verify-otp`);
    }
};







exports.resendOtp = async (req, res) => {
    try {
        const  email  = req.session.user_email;

        const user = await User.findOne({ email });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp; 
        user.otpExpires = Date.now() + 300000;


        console.log(otp);
        
     
        await sendOtp(email, otp);
        await user.save();

        return res.status(200).json({ success: true, message: 'A new OTP has been sent to your email' });
    } catch (error) {
        console.error('Error resending OTP:', error);
        return res.status(500).json({ success: false, message: 'Failed to resend OTP. Please try again later.' });
    }
};

// // Password validation function
// function validatePassword(password) {
//     // Check password length
//     if (password.length < 6) return false;

//     // Check for at least 2 numbers
//     const numberCount = (password.match(/\d/g) || []).length;
//     return numberCount >= 2;
//}






exports.loginGet = (req, res) => {
    try {
        res.render('user/login');
    } catch (error) {
        console.error('Error rendering login page:', error);
        req.flash('error', 'Something went wrong. Please try again later.');
        res.redirect('/login');
    }
};






exports.loginPost = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login'); 
        }

        if (user.isBlocked) {

            req.flash('error','Your account has been blocked.')
            
            return res.redirect('/login'); 
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login'); 
        }

        if(!user.isVerified){
           req.flash('error','Please verify your email before logging in.')
           return res.redirect('/verify-otp')
        }
   
        req.session.userId = user._id;
        // req.flash('success', 'Login successful!');
        return res.redirect('/'); 
    } catch (error) {
        console.error('Error during login:', error);
        req.flash('error', 'Something went wrong during login. Please try again.');
        return res.redirect('/login'); 
    }
};






exports.logout = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error during logout:', err);
                req.flash('error', 'Failed to logout. Please try again.');
                return res.redirect('/');
            }
          return  res.redirect('/login');
        });
    } catch (error) {
        console.error('Error during logout:', error);
        req.flash('error', 'Something went wrong during logout. Please try again.');
      return  res.redirect('/');
    }
};






// Render home page
exports.home = async (req, res) => {
    try {
        const categories = await Categories.find({ isDeleted: false, isBlocked:false});
        const products = await Product.find({ isDeleted: false });
       
      return  res.render('user/home', { categories, products });
    } catch (error) {
        console.error('Error rendering home page:', error);
        req.flash('error', 'Something went wrong. Please try again later.');
       return res.redirect('/login');
    }
};






exports.Getcategories = async (req, res) => {
    try {
        const { id } = req.params;
        const products = await Product.find({  category: id,isDeleted:false }).populate('category');
        const category = await Categories.find({isBlocked:false,isBlocked:false})
        res.render('user/category', { products,category });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
};





exports.Getproducts = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id).populate('category');
        const products = await Product.find({ isDeleted: false ,category:product.category._id,_id:{$ne:id}});
        if (!product) {
            return res.redirect('/');
        }
        res.render('user/product', { product, products });
    } catch (error) {
        console.error(error);
        res.redirect('/');
    }
};
