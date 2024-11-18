const mongoose = require('mongoose');


const addressSchema = new mongoose.Schema({

name:{type:String , required:true},
mobile:{type:String ,required:true},
pincode:{type:String,required:true},
address:{type:String,required:true},
city:{type:String,required:true},
state:{type:String,required:true},
addressType: { type: String, enum: ['Home', 'Work'], required: true },
isDeleted : {type :Boolean},



})


const Address = mongoose.model('Address',addressSchema);

module.exports = Address;