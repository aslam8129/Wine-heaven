const Order = require('../../model/orderSchema');
const Cart = require('../../model/cartSchema');
const Coupon = require('../../model/coupenSchema');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Product = require('../../model/prodectSchema')
const { log } = require('console');
const Wallet = require('../../model/walletModel')
require('dotenv').config();
const User = require('../../model/userSchema')

const razorpay = new Razorpay({
    key_id: process.env.RAZOR_KEY_ID,
    key_secret: process.env.RAZOR_SECRET_ID,
});


exports.initiatePayment = async (req, res) => {
    try {
        const totalAmount = parseInt(req.params.totalAmount);
        const order = await razorpay.orders.create({
            amount: totalAmount * 100, 
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });
console.log('1');

        res.json({ orderID: order.id });
    } catch (err) {
        console.error("Error creating Razorpay order:", err);
        console.log('2');
        
        res.status(500).json({
            success: false,
            message: "Error initiating payment"
        });
    }
};

exports.validateCoupon = async (req, res) => {
    try {
        const { couponCode, totalAmount } = req.body;

      

    
        if (!couponCode || totalAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input parameters'
            });
        }

      
        const coupon = await Coupon.findOne({
            code: couponCode.toUpperCase(),
            isActive: true,
            validFrom: { $lte: new Date() },
           // validUntil: { $gte: new Date() } 
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired coupon code'
            });
        }

 
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                message: 'Coupon usage limit has been reached'
            });
        }


        if (totalAmount < coupon.minimumPurchase) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase of ₹${coupon.minimumPurchase} required`
            });
        }

        let discount = 0;
        switch (coupon.discountType) {
            case 'percentage':
                discount = (totalAmount * coupon.discountAmount) / 100;
                // if (coupon.maximumDiscount) {
                //     discount = Math.min(discount, coupon.maximumDiscount);
                // }
                break;
            case 'fixed':
                discount = Math.min(coupon.discountAmount, totalAmount);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid coupon type'
                });
        }

      
        discount = Math.round(discount * 100) / 100;

        coupon.usedCount += 0;
        await coupon.save();

        return res.json({
            success: true,
            discount,
            message: 'Coupon applied successfully',
            discountType: coupon.discountType
        });

    } catch (error) {
        console.error('Coupon validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Coupon validation failed'
        });
    }
};



/// Place Order
exports.placeOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { 
            addressId, 
            paymentMethod, 
            couponCode, 
            razorpay_payment_id, 
            razorpay_order_id, 
            razorpay_signature 
        } = req.body;

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty',
            });
        }

        let totalAmount = cart.items.reduce(
            (total, item) => total + item.productPrice * item.productCount,
            0
        ) + 100;

        let discount = 0;

        if (couponCode) {
            const coupon = await Coupon.findOne({ 
                code: couponCode.toUpperCase(),
                isActive: true 
            });

            if (coupon) {
                if (coupon.discountType === 'percentage') {
                    discount = (totalAmount * coupon.discountAmount) / 100;
                    if (coupon.maximumDiscount) {
                        discount = Math.min(discount, coupon.maximumDiscount);
                    }
                } else {
                    discount = coupon.discountAmount;
                }

                await Coupon.updateOne(
                    { _id: coupon._id },
                    { $inc: { usedCount: 1 } }
                );
            }
        }

        const finalAmount = totalAmount - discount;

        if (paymentMethod === 'Wallet') {
            const wallet = await Wallet.findOne({ userID: userId });

            if (!wallet) {
                return res.status(400).json({
                    success: false,
                    message: 'Wallet not found',
                });
            }

            const walletBalance = wallet.balance || 0;

            if (walletBalance < finalAmount) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient wallet balance',
                });
            }

            wallet.balance -= finalAmount;

            wallet.transaction.push({
                wallet_amount: finalAmount,
                order_id: req.body.orderId || null,
                transactionType: 'Debited',
                transaction_date: new Date(),
            });

            await wallet.save();
        }

        const order = new Order({
            userId,
            items: cart.items.map(item => ({
                productId: item.productId._id,
                productName: item.productId.name,
                productCount: item.productCount,
                productPrice: item.productPrice,
                productImage: item.productId.images[0],
                productStatus: 'Pending' 
            })),
            shippingAddress: addressId,
            paymentMethod,
            totalAmount: finalAmount,
            discount,
            couponCode,
            orderStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Confirmed',
            paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
        });

        if (razorpay_payment_id) {
            order.paymentDetails = {
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature,
            };
        }

        for (const item of cart.items) {
            const product = await Product.findById(item.productId._id);
            if (product.stock < item.productCount) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product: ${product.name}`,
                });
            }
            product.stock -= item.productCount;
            await product.save();
        }

        await order.save();

        
        await Cart.updateOne({ userId }, { $set: { items: [] } });

       
        const updateProductStatus = async () => {
            let allItemsShipped = true;
            for (const item of order.items) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.productStatus = 'Confirmed'; 
                    await product.save();

                   
                    if (item.productStatus !== 'Shipped') {
                        allItemsShipped = false;
                    }
                }
            }

           
            if (allItemsShipped) {
                await Order.updateOne({ _id: order._id }, { $set: { orderStatus: 'Shipped' } });
            }
        };

        await updateProductStatus();

        res.json({
            success: true,
            message: 'Order placed successfully',
            orderId: order._id,
        });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({
            success: false,
            message: 'Error placing order',
        });
    }
};



exports.verifyPayment = async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature 
        } = req.body;
        
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZOR_SECRET_ID)
            .update(sign.toString())
            .digest("hex");


        if (razorpay_signature === expectedSign) {
            return res.status(200).json({
                success: true,
                message: "Payment verified successfully"
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid signature sent!"
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error!"
        });
    }
};



exports.getorder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const order = await Order.find({ userId })
        .populate('shippingAddress')  
        .populate({
            path: 'items.productId',
            populate: { 
                path: 'category',  
                select: 'name' 
            }
        })
        .sort({ createdAt: -1 })
        .limit(1);
    ;  

      
        if (!order || order.length === 0) {
            return res.status(404).send('Order not found');
        }

        res.render('user/conformOrder', { order: order[0] });  
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
}


exports.cancelOrder = async (req, res) => {
    try {
        let { orderId, productId, paymentId, reason } = req.body;

        if (!orderId || !productId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID or Product ID is missing',
            });
        }

        const order = await Order.findById(orderId).populate('items.productId');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        const item = order.items.find(item => item.productId._id.toString() === productId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in the order',
            });
        }

        const product = await Product.findById(productId);
        if (product) {
            product.stock += item.productCount;
            await product.save();
        }

        item.productStatus = 'Cancelled';

        
        const discountAmount = (item.productPrice * (product.discount || 0)) / 100; 
        const refundAmount = (item.productCount * item.productPrice) - (item.productCount * discountAmount);

        const userId = req.session.userId;
        if (order.paymentMethod === 'Razorpay' || order.paymentMethod === 'Wallet') {
            let wallet = await Wallet.findOne({ userId: userId });

           


                if (!wallet) {
                    wallet = new Wallet({
                        userID: order.userId,
                        balance: 0,
                        transaction: [],
                    });
                }
                wallet.balance += refundAmount;

                
                wallet.transaction.push({
                    wallet_amount: refundAmount,
                    order_id: order._id,
                    transactionType: 'Credited',
                    transaction_date: new Date(),
                });

                await wallet.save();
            }
        

        order.statusHistory.push({
            status: 'Cancelled',
            timestamp: new Date(),
            reason: reason || 'User cancelled the product',
        });

        await order.save();

        res.json({
            success: true,
            message: 'Product cancelled successfully, refund issued.',
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while cancelling the product.',
        });
    }
};



exports.returnOrder = async (req, res) => {
    try {
        let { orderId, productId, paymentId, reason } = req.body;

        if (!orderId || !productId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID or Product ID is missing',
            });
        }

        const order = await Order.findById(orderId).populate('items.productId');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        const item = order.items.find(item => item.productId._id.toString() === productId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in the order',
            });
        }

        item.productStatus = 'Send Return Request';

       
        order.statusHistory.push({
            status: 'Send Return Request',
            timestamp: new Date(),
            reason: reason || 'User requested a return',
        });

        await order.save();

        res.json({
            success: true,
            message: 'Return request sent successfully.',
        });
    } catch (error) {
        console.error('Error processing return request:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing the return request.',
        });
    }
};
