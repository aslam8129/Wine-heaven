const Order = require('../../model/orderSchema');
const Product = require('../../model/prodectSchema');
const Wallet = require('../../model/walletModel');

const availableStatusUpdates = {
    'Pending': ['Confirmed', 'Cancelled'],
    'Confirmed': ['Shipped', 'Cancelled'],
    'Shipped': ['Out for Delivery', 'Cancelled'],
    'Out for Delivery': ['Delivered', 'Cancelled'],
    'Delivered': [],
    'Cancelled': [],
    'Send Return Request':['Returned']
};


exports.getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; 
        const skip = (page - 1) * limit;

        const orders = await Order.find()
            .populate('userId')
            .populate('items.productId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);

        res.render('admin/orderList', {
            orders,
            availableStatusUpdates,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        req.flash('error', 'Failed to fetch orders');
        res.redirect('/admin/dashboard');
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId, newStatus, productId } = req.body;

        
        const order = await Order.findById(orderId);
        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/admin/orders');
        }

      
        const item = order.items.find(item => item.productId.toString() === productId);
        if (!item) {
            req.flash('error', 'Product not found in the order');
            return res.redirect('/admin/orders');
        }

        const validStatusUpdates = availableStatusUpdates[item.productStatus] || [];
        if (!validStatusUpdates.includes(newStatus)) {
            req.flash('error', 'Invalid status transition');
            return res.redirect('/admin/orders');
        }

     
        item.productStatus = newStatus;

        if (newStatus === 'Returned') {
            const product = await Product.findById(productId);
            if (product) {
                product.stock += item.productCount;
                await product.save();
            }

            if (['Razorpay', 'Wallet'].includes(order.paymentMethod)) {
                let wallet = await Wallet.findOne({ userID: order.userId });
                if (!wallet) {
                    wallet = new Wallet({
                        userID: order.userId,
                        balance: 0,
                        transaction: [],
                    });
                }

                wallet.balance += order.totalAmount; 
                wallet.transaction.push({
                    wallet_amount: order.totalAmount,
                    order_id: order._id,
                    transactionType: 'Credited',
                    transaction_date: new Date(),
                });

                await wallet.save();
            }
        }

        await order.save();

        req.flash('success', 'Order status updated successfully');
        res.redirect('/admin/orders');
    } catch (error) {
        console.error('Error updating order status:', error);
        req.flash('error', 'Failed to update order status');
        res.redirect('/admin/orders');
    }
};




exports.getorderDetails = async (req, res) => {
    try {
       
        const id = req.params.id

        console.log(id);
        
        const order = await Order.findById( id )
        .populate('shippingAddress')  
        .populate({
            path: 'items.productId',
            populate: { 
                path: 'category',  
                select: 'name' 
            }
        })
       
    ;  

      
        if (!order || order.length === 0) {
            return res.status(404).send('Order not found');
        }

        res.render('admin/orderDetails', { order: order });  
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
}
