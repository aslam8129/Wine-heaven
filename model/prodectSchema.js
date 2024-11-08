const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    // category: { type: String, required: true },
    description:{type:String,required:true},
    stock: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
    // images: [{ url: String, public_id: String }],
    images: [String],
    isBlocked:{type:Boolean,default:false},
    isDeleted: { type: Boolean, default: false },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
