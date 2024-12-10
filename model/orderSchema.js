const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Myuser',
        required: true
    },
    couponOfferPrice:{
        type:Number
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName: {
            type: String,
            required: true
        },
        productCount: {
            type: Number,
            required: true
        },
        productPrice: {
            type: Number,
            required: true
        },
        productImage: {
            type: String
        },
        productDiscount:{
             type:Number
        },
        productStatus:{
            type:String,
             enum: ['Order Not Conform','Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled','Send Return Request','Returned'],
        default: 'Pending'
        }
        
    }],
    shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    couponCode: {
        type: String
    },
    paymentMethod: {
        type: String,
        enum: ['Cash on Delivery', 'Razorpay', 'Wallet'],
        required: true
    },
    paymentDetails: {
        razorpay_payment_id: String,
        razorpay_order_id: String,
        razorpay_signature: String
    },
    orderReturnReason:{
type:String
    },
    orderStatus: {
        type: String,
        enum: ['Order Not Conform','Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled','Send Return Request','Returned'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Returned'],
        default: 'Pending'
    },
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    paid:{
        type:Boolean,
        default:true
    }
});

module.exports = mongoose.model('Order', orderSchema);