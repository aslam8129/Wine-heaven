const Cart = require('../../model/cartSchema');
const Product = require('../../model/prodectSchema');
const User = require('../../model/userSchema');
const Addresses = require('../../model/userAddress')
const Order = require('../../model/orderSchema')


exports.addtoCartGet = async (req,res)=>{
    try{
          const userId =  req.session.userId;
          const {productId} = req.body;
          if (!userId) {
            return res.redirect('/login')
        }

          let cart = await Cart.findOne({userId}).populate('items.productId');
          if(!cart){
            return res.render('user/addToCart',{cart:{items:[]},subtotal:0,discount:0,total:0});

          }

        cart.items = await Promise.all(cart.items.map(async item =>{
            const product = await Product.findById(item.productId._id);
             item.productPrice = product.price;
             item.productDiscountPrice = product.priceAfterDiscount;
             return item;
        }));


      
           
        

        await cart.save();


        const subtotal = cart.items.reduce((sum,item)=>sum + (item.productPrice * item.productCount),0);
        const discount = cart.items.reduce((sum, item) => sum + ((item.productPrice - item.productDiscountPrice) * item.productCount), 0);
        const total = (subtotal - discount)+100;

        res.render('user/addToCart',{cart,subtotal,discount,total});
    }catch(error){
        console.log(`Error in addtoCartGet: ${error}`);
        res.status(500).send('Internal Server Error');
    }
    }



    exports.updateQuantity = async (req, res) => {
        try {
            const { productId,quantity } = req.body;
            const userId = req.session.userId;
    
            if (!userId) {
                return res.redirect('/login')
            }
    
            console.log(`User ID from session: ${userId}`);
    
            let cart = await Cart.findOne({ userId }).populate('items.productId');
    
            if (!cart) {
                console.log('Cart not found, creating new cart');
                cart = new Cart({ userId, items: [] });
                await cart.save();
            }
    
            const product = await Product.findById(productId);
    
            if (!product) {
                return res.send('Product not found');
            }
    
            const itemIndex = cart.items.findIndex(item => item.productId._id.toString() === productId);
    
            if (itemIndex > -1) {
                const item = cart.items[itemIndex];
                item.productCount = quantity; // Update the product count
                item.productPrice = product.price;
                item.productDiscountPrice = product.priceAfterDiscount;
            } else {
                cart.items.push({
                    productId,
                    productCount: quantity,
                    productPrice: product.price,
                    productDiscountPrice: product.priceAfterDiscount
                });
            }
    
            await cart.save();
    
            // Calculate subtotal, discount, and total
            const subtotal = cart.items.reduce((sum, item) => sum + (item.productPrice * item.productCount), 0);
            const discount = cart.items.reduce((sum, item) => sum + ((item.productPrice - item.productDiscountPrice) * item.productCount), 0);
            const total = (subtotal - discount) + 100; // Assuming shipping is $100
    
            cart.payableAmount = total;
    
            await cart.save();
    
            res.render('user/addToCart', { cart, subtotal, discount, total });
    
        } catch (error) {
            console.log(`Error in updateQuantity: ${error}`);
            res.status(500).send('Internal Server Error');
        }
    };
    


    exports.removeFromCart = async (req, res) => {
        try {
            const { productId } = req.body;
            const userId = req.session.userId;
            if (!userId) {
                return res.send('User not found');
            }
    
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            if (!cart) {
                return res.send('Cart not found');
            }
    
            cart.items = cart.items.filter(item => item.productId._id.toString() !== productId);
            await cart.save();
    
            const subtotal = cart.items.reduce((sum, item) => sum + (item.productPrice * item.productCount), 0);
            const discount = cart.items.reduce((sum, item) => sum + ((item.productPrice - item.productDiscountPrice) * item.productCount), 0);
            const total = subtotal - discount;
    
            res.render('user/addToCart', { cart, subtotal, discount, total });
        } catch (error) {
            console.log(`Error in removeFromCart: ${error}`);
            res.status(500).send('Internal Server Error');
        }
    };


    exports.getcheckout = async (req, res) => {
        try {
            const userId = req.session.userId;
            const email = req.session.user_email;
    
            if (!userId) {
                return res.send('User not found');
            } 
            let orderSummary = await Cart.findOne({ userId }).populate('items.productId');
            let user = await User.findOne({ email }).populate('addresses');
    
            if (!user || !user.addresses) {
                return res.send('No addresses found');
            }
    
            if (!orderSummary) {
                orderSummary = {
                    items: [],
                    subtotal: 0,
                    shipping: 0,
                    discount: 0,
                    total: 0
                };
            } else {
                orderSummary.subtotal = orderSummary.items.reduce((acc, item) => acc + (item.productCount * item.productPrice), 0);
                orderSummary.shipping = 100;
                orderSummary.savings = orderSummary.items.reduce((acc, item) => acc + (item.productDiscountPrice ? (item.productCount * (item.productPrice - item.productDiscountPrice)) : 0), 0);
                orderSummary.discount = orderSummary.items.reduce((sum, item) => sum + ((item.productPrice - item.productDiscountPrice) * item.productCount), 0);
                orderSummary.total = orderSummary.subtotal - orderSummary.discount + orderSummary.shipping;
            }
            
            req.session.total = orderSummary.total;
    
            let addresses = user.addresses.filter(address => !address.isDelete);
    
            res.render('user/checkout', { orderSummary, addresses });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    };
    
    

    exports.placeOrder = async (req, res) => {
        try {
            const { shipping_address, payment_method } = req.body;
            const user = req.session.userId;
            const cart = await Cart.findOne({ userId: user }).populate('items.productId');
            const address = await Addresses.findById(shipping_address);
    
            if (!cart || !cart.items || cart.items.length === 0) {
                req.flash('error', 'Cart is empty');
                return res.redirect('/checkout');
            }
    
            const totalQuantity = cart.items.reduce((sum, item) => sum + item.productCount, 0);
            const totalPrice = cart.items.reduce((sum, item) => sum + (item.productCount * item.productPrice), 0);
    
      
    
            const order = new Order({
                userId: user,
                orderId: Math.floor(Math.random() * 1000000),
                items: cart.items.map(item => ({
                    productId: item.productId._id,
                    productName: item.productId.name,
                    productCategory: item.productId.category,
                    productCount: item.productCount, // Ensure this is correct
                    productPrice: item.productPrice,
                    productImage: item.productId.image,
                    productDiscountPrice: item.productDiscountPrice,
                    productDiscount: item.productId.discount,
                    productStatus: 'Pending'
                })),
                totalQuantity,
                totalPrice,
                address: {
                    contactName: address.name,
                    street: address.street,
                    city: address.city,
                    state: address.state,
                    country: address.country,
                    pincode: address.pincode,
                    mobile: address.mobile
                },
                paymentMethod: payment_method,
            });
    
            await order.save();
    
            // Deduct stock for each product
            for (const item of cart.items) {
                const product = await Product.findById(item.productId._id);
                if (product) {
                    product.stock -= item.productCount;
                    await product.save();
                }
            }
    
            // Clear the user's cart
            await Cart.deleteMany({ userId: user });
    
            res.send('Order placed successfully');
        } catch (error) {
            console.log(`Error in placeOrder: ${error}`);
            res.status(500).send('Internal Server Error');
        }
    };
    


     
  