const Order = require('../../model/orderSchema')
const Cart = require('../../model/cartSchema')
const Product = require('../../model/prodectSchema')
const Address = require('../../model/userAddress')
const User = require('../../model/userSchema')
const Wallet = require('../../model/walletModel')
const Coupon = require('../../model/coupenSchema')



exports.checkAddaddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        let addressData = null;

        if (addressId) {
            addressData = await Address.findById(addressId).exec();
        }

        res.render('user/checkAddaddress', { address: addressData });
    } catch (error) {

        res.status(500).send(error.message);
    }
}


exports.faied = async (req, res) => {
    try {

        const userId = req.session.userId;

        const {
            addressId,
            paymentMethod,
            couponCode,

        } = req.body;

        // Validate required fields

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
        const order = new Order({
            userId,
            items: cart.items.map(item => ({
                productId: item.productId._id,
                productName: item.productId.name,
                productCount: item.productCount,
                productPrice: item.productPrice,
                productImage: item.productId.images[0],
                productStatus: 'Order Not Conform'
            })),

            shippingAddress: addressId,
            paymentMethod,
            totalAmount: finalAmount,
            discount,
            couponCode,
            orderStatus: 'Pending',
            paymentStatus: 'Pending'

        });
        order.paid = false
        await order.save();






        for (const item of cart.items) {
            const product = await Product.findById(item.productId._id);
            if (product) {
                product.stock -= item.productCount;
                await product.save();
            } else {

            }
        }


        await Cart.updateOne({ userId }, { $set: { items: [] } });

        res.json({
            success: false,
            message: 'Order placed successfully',
            orderId: order._id,
        });


    } catch (error) {

        res.status(500).json({
            error: 'Internal server error processing payment failure',
            details: error.message
        });
    }
};




exports.checkaddAddressPost = async (req, res) => {
    try {

        const newAddress = new Address();
        Object.assign(newAddress, req.body);


        await newAddress.save();



        const email = req.session.user_email;


        const user = await User.findOne({ email });


        if (user) {

            user.addresses.push(newAddress._id);



            await user.save();


        } else {

        }

        return res.redirect('/checkout');
    } catch (error) {


        res.status(500).send(error.message);
    }
};



exports.renderEditAddrescheckout = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);
        return res.render('user/checkoutAddressEdit', { address })
    } catch (error) {
        res.status(500).send(error.message);

    }
}


exports.editAddressPostcheckout = async (req, res) => {
    try {
        const addressId = req.params.id;

        await Address.findByIdAndUpdate(addressId, req.body)
        return res.redirect('/checkout');
    } catch (error) {

        res.status(500).send("Internal Server Error");

    }
}

exports.order = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const userId = req.session.userId;

        const totalOrders = await Order.countDocuments({ userId });
        const totalPages = Math.ceil(totalOrders / limit);


        const orders = await Order.find({ userId })
            .populate('items.productId', 'name image')
            .skip(skip)
            .limit(limit);


        res.render('user/orders', {
            orders,
            currentPage: page,
            totalPages,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
        });
    } catch (error) {

        res.status(500).send(error.message);
    }
};


exports.ordersList = async (req, res) => {
    try {
        const id = req.params.id
      
        
        const orders = await Order.findById(id)
        .populate('shippingAddress')
        .populate('items.productId')
        .exec();
    

        res.render('user/listOrder', {
            orders,
            // noOrders: false,

        });
    } catch (error) {

        res.status(500).send(error.message);
    }
};



exports.getWallet = async (req, res) => {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    try {

        const wallet = await Wallet.findOne({ userID: userId }).exec();
        if (!wallet) {
            return res.render('user/wallat', {
                wallet: { balance: 0, transaction: [] },
                page,
                totalpages: 1,
                limit,
                message: 'No wallet found. Create your first transaction!'
            });
        }


        const totalitems = wallet.transaction.length;
        const totalpages = Math.ceil(totalitems / limit);
        const paginatedTransactions = wallet.transaction
            .slice((page - 1) * limit, page * limit)
            .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));


        res.render('user/wallat', {
            wallet: { ...wallet._doc, transactions: paginatedTransactions },
            page,
            totalpages,
            limit,
            error: null,
            message: null
        });
    } catch (error) {

        res.render('user/wallat', {
            wallet: { balance: 0, transactions: [] },
            page: 1,
            totalpages: 1,
            limit: 5,
            error: 'An error occurred while fetching wallet data.',
            message: null
        });
    }
};
