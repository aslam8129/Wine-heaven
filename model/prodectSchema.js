const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  stock: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
  images: [String],
  isBlocked: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  priceAfterDiscount:{
    type:Number
  }
}, { timestamps: true });


ProductSchema.pre('save', function (next) {
  if (this.stock <= 0) {
    this.status = 'unavailable';
  } else {
    this.status = 'available';
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
