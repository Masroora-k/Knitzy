const User = require('../../models/userSchema')
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const Review = require('../../models/reviewSchema');
const Cart = require('../../models/cartSchema');
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');
const moment = require('moment-timezone');



const getOrderPage = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        if (!userId) {
            return res.redirect('/login'); 
        }

        const orders = await Order.find({user: userId}).populate('orderItems.product');
        console.log('Orders: ',orders);


        const createdAt = orders.createdAt;
        const formattedDate = moment(createdAt).tz("Asia/Kolkata").format('dddd, MMMM Do YYYY, h:mm A');

        const delivery = orders.deliveryDate;
        const formattedDeliveryDate = moment(delivery).tz("Asia/Kolkata").format('dddd, MMMM Do YYYY, h:mm A'); 

        res.render('orders',{
            user: userId,
            orders: orders,
            createdAt:  formattedDate,
            deliveryDate: formattedDeliveryDate,
            cartQuantity: req.session.cartQuantity || 0,
            
        })

        
    } catch (error) {
        console.error('Error: ',error);
        res.redirect('/pageNotFound');
        
    }
}

const cancelOrderItem = async (req, res) => {
    try {
        const { orderId } = req.params;

        const {reason} = req.body;
       
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        
        
       
        
            order.status = 'Cancelled';
        

        order.cancellationReason.push({ reason});
       
        await order.save();

        
        res.json({ success: true });
    } catch (error) {
        console.error('Error canceling order item:', error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
};




module.exports = {
    getOrderPage,
    cancelOrderItem,
}