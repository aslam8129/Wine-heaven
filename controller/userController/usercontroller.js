const User = require('../../model/userSchema');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();
const crypto = require('crypto')
const Product = require('../../model/prodectSchema');
const Categories = require('../../model/Category');
const Address = require('../../model/userAddress');

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
        const userId = req.session.userId;
        if (userId) {
            return res.redirect('/');
        }
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
console.log('9090');

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








exports.loginGet = (req, res) => {

    try {
        const userId = req.session.userId;
        if (userId) {
            return res.redirect('/');
        }
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
            req.flash('error','Your account has been blocked.');
            return res.redirect('/login'); 
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login'); 
        }

        if(!user.isVerified){
           req.flash('error','Please verify your email before logging in.');
           return res.redirect('/verify-otp');
        }
   
        // Store only the user ID in the session
        req.session.userId = user._id;
        req.session.user_email = user.email;
        
        
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








exports.forgetpassword = async(req,res)=>{
    try{
       res.render('user/forgotpassword')
    }catch(error){
console.log(`error in forgetpassword :${error}`);

    }
}



exports.forgetpasswordPost = async(req,res)=>{
    try{
       const {email} = req.body;
       const user = await User.findOne({email});

       if(!user){
        return res.status(404).send('Email not found');

       }

       const token = crypto.randomBytes(20).toString('hex')
       user.resetPasswordToken = token;
       user.resetPasswordExpires = Date.now() +3600000  // 1 house
       await user.save();
       const PORT =process.env.PORT||3005;
       const resetLink = `http://localhost:${PORT}/reset-password?token=${token}&email=${email}`;


       console.log(resetLink);
       


       const transporter = nodemailer.createTransport({
        service :"Gmail",
        auth :{
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
       });


       const mailOptions = {
        from :process.env.EMAIL_USER,
        to:email,
        subject: 'password reset',
        text: `click the following link to reset your password: ${resetLink}`
       };

       transporter.sendMail(mailOptions,(error,info)=>{
        if(error){
            return res.status(500).send('Error sending email')
        }
          req.flash('success', 'you check youer email forgot passwork link sending ');
        res.redirect('/forgot-password')
       })
    }catch(error){
console.log(`error in forgetpassswordpost ${error}`);

    }
}




exports.resetPasswordGet = async (req,res) =>{
    try{
      const {token,email} = req.query;
      const user = await User.findOne({
        email,
        resetPasswordToken :token,
        resetPasswordExpires :{$gt :Date.now()}
      });

      if(!user){
        return res.status(400).send('password reset token is invalid')
      }

      res.render('user/resetpassWord',{token ,email});

    }catch(error){
         console.log(`error in reset password ${error}`);
         
    }
}



exports.resentPasswordPost = async (req,res)=>{
    try{
       const {token,email,password} = req.body;
       const user = await User.findOne({
        email,
        resetPasswordToken:token,
        resetPasswordExpires:{$gt:Date.now()}
       });

       if(!user){
        return res.status(400).send('password reset token is invalid');

       }

       const hashedPassword = await bcrypt.hash(password,10);


       user.password = hashedPassword;
       user.resetPasswordToken = undefined;
       user.resetPasswordExpires = undefined;



       await user.save();
       req.flash('success', 'password changed ');
       res.redirect('login')
    }catch(error){
        console.log(`error in resentpassword post :${error}`);
        
    }
}