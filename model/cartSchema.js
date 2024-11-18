const mongoose = require('mongoose');
const product = require('../model/prodectSchema')
const itemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productCount: {
    type: Number,
    default: 1,
  },
  productPrice: {
    type: Number,
    required: true
  },
  productDiscountPrice: {
    type: Number
  }
}, { _id: false, timestamps: true });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Myuser',
    required: true
  },
  items: [itemSchema],
  payableAmount: {
    type: Number,
    default: 0
  }
});



  
  const Cart = mongoose.model('Cart', cartSchema);
  module.exports = Cart;