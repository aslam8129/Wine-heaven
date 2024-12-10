const Order = require('../../model/orderSchema');
const Cart = require('../../model/cartSchema');
const Product = require('../../model/prodectSchema')
require('dotenv').config();
const User = require('../../model/userSchema')

exports.paymentFaildOrderId = async (req, res) => {
    try {
        console.log(`Received orderId: ${req.params.orderId}`);
        const { orderId } = req.params;
        
        
        
        const order = await Order.findById(orderId)
            .populate('items.productId')
            .populate('shippingAddress');

         
            

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }


        res.json({
            success: true,
            totalAmount: order.totalAmount,
            items: order.items,
            discount: order.discount || 0,
        });
    } catch (error) {
       
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        

        const userId = req.session.userId; 
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User is not logged in',
            });
        }

        
       

       
    const latestPendingOrder = await Order.findOne({
        userId: userId,
        orderStatus: 'Pending',
    }).sort({ updatedAt: -1 });

   
    if (!latestPendingOrder) {
   
        return res.status(404).json({ success: false, message: 'No pending order found.' });
    }

 
    latestPendingOrder.items.forEach(item => {
        item.productStatus = 'Confirmed'; 
    });

    
    latestPendingOrder.paymentStatus = 'Paid';
    latestPendingOrder.orderStatus = 'Confirmed';
    latestPendingOrder.paid = true;




   
    
    await latestPendingOrder.save();


        const cart = await Cart.findOne({ userId }).populate('items.productId');
     
  

       

        
        res.json({
            success: true,
            message: 'Order updated successfully',
            orderId: latestPendingOrder._id,
        });
        
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order',
            details: error.message,
        });
    }
};

