const mongoose = require('mongoose');


const offerSchema = new mongoose.Schema({
offerCategory:{
    type: mongoose.Schema.Types.ObjectId, ref: 'Category', 
   
},
offerProduct:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    
},
offerName:{
    type:String,
    required:true
},

discountPercentage:{
    type:Number,
    required:true
},
offerType:{
type:String,
required:true
},

isActive:{
    type:Boolean,
    default:false
}
},{timestamps:true});



module.exports = mongoose.model('offers',offerSchema)