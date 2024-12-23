
const mongoose = require('mongoose');


const categorySchema = new mongoose.Schema({
    name:{
        type :String,
        required:true,
       validate:function(v){
        return /^[A-Z]/.test(v)
       },
       message:(props) => `${props.value} must start with a capital letter!`
    },
    imageUrl: {
        type: String,
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    isDeleted:{
        type:Boolean,
        default:false,
    },
    
 } ,{
    timestamps:true,
    
})

module.exports = mongoose.model('Category',categorySchema);