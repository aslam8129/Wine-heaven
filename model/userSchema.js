const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone:{type:String},
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    googleId: {
      type: String,
      sparse: true, // Applies the unique constraint only to non-null/non-undefined values
  },
  
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    addresses: [{type:mongoose.Schema.Types.ObjectId,ref:'Address'}], 
});   

module.exports = mongoose.model('Myuser', userSchema);
