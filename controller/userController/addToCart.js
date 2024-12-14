const Cart = require('../../model/cartSchema');
const Product = require('../../model/prodectSchema');
const User = require('../../model/userSchema');
const Coupon = require('../../model/coupenSchema')



exports.addtoCartGet = async (req, res) => {
    try {
        const userId = req.session.userId;

       
        if (!userId) {
            return res.redirect('/login');
        }

        let cart = await Cart.findOne({ userId }).populate('items.productId');
       
        

        if (!cart) {
         
            return res.render('user/addToCart', {
                cart: { items: [] },
                subtotal: 0,
                discount: 0,
                total: 0,
            });
        }


        cart.items = await Promise.all(
            cart.items.map(async (item) => {
                const product = await Product.findById(item.productId._id);
                if (!product) {
                    throw new Error(`Product with ID ${item.productId._id} not found`);
                }

                item.productPrice = product.priceAfterDiscount;
                item.productDiscountPrice = product.priceAfterDiscount - (product.price * (product.productAllDiscount / 100));
                
                 
                return item;
            })
        );
        

       

       
        const subtotal = cart.items.reduce((sum, item) => sum + (item.productPrice * item.productCount), 0);
        const discount = cart.items.reduce(
            (sum, item) => sum + (item.productPrice - item.productDiscountPrice) * item.productCount,
            0
        );
        const total = subtotal + 100; 
        cart.payableAmount = total;
        await cart.save();


        res.render('user/addTocart', {
            cart,
            subtotal,
            discount,
            total,
        });
    } catch (error) {
        
        res.status(500).send('Internal Server Error');
    }
};


exports.updateQuantity = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect('/login');
        }

        let cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart) {
      
            cart = new Cart({ userId, items: [] });
            await cart.save();
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

    
        const itemIndex = cart.items.findIndex((item) => item.productId._id.toString() === productId);

        if (itemIndex > -1) {
       
            const item = cart.items[itemIndex];
            item.productCount = parseInt(quantity, 10);
            item.productPrice = product.priceAfterDiscount;
            item.productDiscountPrice = product.priceAfterDiscount - (product.priceAfterDiscount* (product.productAllDiscount / 100));
        } else {
          
            cart.items.push({
                productId,
                productCount: parseInt(quantity, 10),
                productPrice: product.priceAfterDiscount,
                productDiscountPrice: product.priceAfterDiscount - (product.priceAfterDiscount * (product.productAllDiscount / 100)),
            });
        }

        await cart.save();

       
        const subtotal = cart.items.reduce((sum, item) => sum + (item.productPrice * item.productCount), 0);
       // const discount = cart.items.reduce(
          //  (sum, item) => sum + (item.productPrice - item.productDiscountPrice) * item.productCount,
           // 0
      //  );
        const total = subtotal + 100; 

        cart.payableAmount = total;
        await cart.save();

        res.render('user/addTocart', {
            cart,
            subtotal,
            
            total,
        });
    } catch (error) {
   
        res.status(500).send('Internal Server Error');
    }
};


    exports.removeFromCart = async (req, res) => {
        try {
            const { productId } = req.body;
            const userId = req.session.userId;
            if (!userId) {
                return res.redirect('/login');
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
    
            res.render('user/addTocart', { cart, subtotal, discount, total });
        } catch (error) {
           
            res.status(500).send('Internal Server Error');
        }
    };


    exports.getcheckout = async (req, res) => {
        try {
            const userId = req.session.userId;
            const email = req.session.user_email;

            const coupon = await Coupon.find();
    
            if (!userId) {
                return res.redirect('/login');
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
                orderSummary.subtotal =  orderSummary.payableAmount-100;
                orderSummary.shipping = 100;
                orderSummary.discount = 
                orderSummary.total = orderSummary.payableAmount
            }
          
          
    
            let addresses = user.addresses.filter(address => !address.isDelete);
    
            res.render('user/checkout', { orderSummary, addresses ,coupon});
        } catch (error) {
          
            res.status(500).send('Internal Server Error');
        }
    };
    
    
