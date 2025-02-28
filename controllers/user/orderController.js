const Wallet = require('../../models/walletSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const moment = require('moment-timezone');



const getOrderPage = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        if (!userId) {
            return res.redirect('/login'); 
        }

        const orders = await Order.find({user: userId}).populate('orderItems.product').
        populate('couponId')
        .sort({createdAt: -1});
        

        orders.forEach(order => {
            // Format the createdAt date
            const createdAt = order.createdAt;
            order.formattedCreatedAt = moment(createdAt).format('dddd, MMMM Do YYYY');
            

            // Format the deliveryDate
            const delivery = order.deliveryDate;
            order.formattedDeliveryDate = moment(delivery).format('dddd, MMMM Do YYYY, h:mm A');
            

            order.returnExpireDate = new Date(order.returnExpireDate)
           
            if(order.couponApplied && order.couponId){
                const couponDiscountP = order.couponId.offerPrice;
                order.couponDiscountAmount = (couponDiscountP / 100) * order.totalPrice;
                
            }else{
                order.couponDiscount = 0;
            }
           
        });

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        res.render('orders',{
            user: userId,
            orders: orders,
            currentDate: currentDate,
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
       
        const order = await Order.findOne({ orderId }).populate('orderItems.product');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        
            order.status = 'Cancelled';
        

        order.cancellationReason.push({ reason});
       
        await order.save();

        for(const item of order.orderItems){
            const product = await Product.findById(item.product._id);
            if(product){
                product.quantity += item.quantity;
            }

            if(product.quantity > 0){
                product.status = 'Available';
            }

            await product.save();
        }

        if(order.paymentStatus === 'Paid'){

                const userId = order.user;
        const finalAmount = order.finalAmount;

       let wallet = await Wallet.findOne({userId});
        
       if( wallet){
            wallet.balance += finalAmount;
            wallet.transactions.push({
                amount: finalAmount,
                type: 'Credit',
                description: `Refund for order ${orderId}`,
            });
        }else {
            wallet = new Wallet({
                userId,
                balance: finalAmount,
                transactions: [{
                    amount: finalAmount,
                    type: 'Credit',
                    description: `Refund for order ${orderId}`,
                }]
            });
        }

        await wallet.save();


        }      
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error canceling order item:', error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
};



const returnRequest = async (req,res)=>{
    try {
        const { orderId } = req.params;

        const {reason} = req.body;
       
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

         order.status = 'Return Request';
       
        order.returnRequestReason.push({ reason});
       
        await order.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error in return order item:', error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
}



const viewOrderDetails = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        if (!userId) {
            return res.redirect('/login'); 
        }

        const orderId = req.query.order;

           const  order = await Order.findById(orderId).populate('orderItems.product');
           const invoiceDate = order.invoiceDate;
           order.formattedInvoiceDate = moment(invoiceDate).format('dddd, MMMM Do YYYY');
        
           const updatedAt = order.updatedAt;
           order.formattedUpdatedAt = moment(updatedAt).format('dddd, MMMM Do YYYY, h:mm A');
           
        res.render('orderDetailsView',{
            order: order,
            user: userId,
            cartQuantity: req.session.cartQuantity || 0,
        })
        
    } catch (error) {

        console.error('Error in viewOrderDetails',error);
        res.redirect('/pageNotFound');
        
    }
}

const trackOrder = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        if (!userId) {
            return res.redirect('/login'); 
        }

        const orderId = req.query.order;
           const  order = await Order.findById(orderId).populate('orderItems.product');

           // Format the createdAt date
           const createdAt = order.createdAt;
           order.formattedCreatedAt = moment(createdAt).format('dddd, MMMM Do YYYY');
          
           const updatedAt = order.updatedAt;
           order.formattedUpdatedAt = moment(updatedAt).format('dddd, MMMM Do YYYY');
          
           // Format the deliveryDate
           const delivery = order.deliveryDate;
           order.formattedDeliveryDate = moment(delivery).format('dddd, MMMM Do YYYY, h:mm A');
           
           const returnExp = order.returnExpireDate;
           order.formattedReturnExpireDate = moment(returnExp).format('dddd, MMMM Do YYYY, h:mm A');
          
           const currentDate = new Date();
         currentDate.setHours(0, 0, 0, 0);

        res.render('trackOrder',{
            order: order,
            user: userId,
            currentDate: currentDate,
            cartQuantity: req.session.cartQuantity || 0,
        })
        
    } catch (error) {

        console.error('Error in trackOrder',error);
        res.redirect('/pageNotFound');
        
    }

}





module.exports = {
    getOrderPage,
    cancelOrderItem,
    returnRequest,
    viewOrderDetails,
    trackOrder,
}