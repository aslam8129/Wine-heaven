const Order = require('../../model/orderSchema');
const Product = require('../../model/prodectSchema');

// Define available status updates for each current status
const availableStatusUpdates = {
    'Pending': ['Confirmed', 'Cancelled'],
    'Confirmed': ['Shipped', 'Cancelled'],
    'Shipped': ['Out for Delivery', 'Cancelled'],
    'Out for Delivery': ['Delivered', 'Cancelled'],
    'Delivered': [],
    'Cancelled': []
};

// Get all orders with pagination
exports.getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; 
        const skip = (page - 1) * limit;

        const orders = await Order.find()
            .populate('userId', 'name email')
            .populate('items.productId', 'name price')
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
        const { orderId, newStatus } = req.body;

      
        const order = await Order.findById(orderId);
        if (!order) {
          
            return res.redirect('/admin/orders');
        }

       
        if (!availableStatusUpdates[order.orderStatus]?.includes(newStatus)) {
            req.flash('error', 'Invalid status transition');
            return res.redirect('/admin/orders');
        }

    
        order.orderStatus = newStatus;
        order.statusHistory.push({
            status: newStatus,
            timestamp: new Date()
        });

        await order.save();

        req.flash('success', 'Order status updated successfully');
        res.redirect('/admin/orders');

    } catch (error) {
        console.error('Error updating order status:', error);
        req.flash('error', 'Failed to update order status');
        res.redirect('/admin/orders');
    }
};