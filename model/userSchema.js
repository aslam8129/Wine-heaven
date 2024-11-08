const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    googleId: {
        type: String,
        unique: true,
       
      },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

module.exports = mongoose.model('Myuser', userSchema);
