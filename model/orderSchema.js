const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Myuser',
        required: true
    },
    orderId: {
        type: Number
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName: {
            type: String
        },
        productCategory: {
            type: String
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
        productDiscountPrice: {
            type: Number
        },
        productDiscount: {
            type: Number
        },        
    }],
    totalQuantity: {
        type: Number
    },
    totalPrice: {
        type: Number,
        required: true
    },
    address: {
        contactName: String,
        street: String,
        city: String,
        state: String,
        country: String,
        pincode: Number,
        mobile:Number,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash on Delivery', 'Wallet', 'UPI'],
        required: true
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    // paymentStatus: {
    //     type: String,
    //     enum: ['Pending', 'Shipped', 'Paid', 'Delivered', 'Cancelled', 'Returned']
    // },
    createdAt: {
        type: Date,
        default: Date.now
    },
    cancellationReason:{
        type:String
    }

});

module.exports = mongoose.model('Orders', orderSchema);
