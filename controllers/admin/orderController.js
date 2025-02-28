
const Order = require('../../models/orderSchema');
const Wallet = require('../../models/walletSchema');
const Product = require('../../models/productSchema');
const moment = require('moment-timezone');




const getOrders = async (req,res)=>{
    try {

        const orderStatus = req.query.orderStatus || null;
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page-1) * limit;

        const orderData = await Order.find({
            status: {$ne: 'Order Not Placed'}
        })
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
        .populate('user','name')
        .populate('address')
        .populate('orderItems.product');
        

        

        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);

        res.render('admin-orders',{
            orders: orderData,
            currentPage: page,
            totalPages: totalPages,
            totalOrders: totalOrders,
            orderStatus: orderStatus
        })
        
    } catch (error) {

        console.error('Error: ',error);
        res.redirect('/admin/pageerror');
        
    }
}



const orderPending = async (req,res)=>{
    try {

        let id = req.query.id;
        const orderStatus = await Order.findById(id);
     

        if(orderStatus.status === 'Delivered'){
            return res.status(500).json({success: false, delivered: true});
        }else if(orderStatus.status === 'Cancelled'){
            return res.status(500).json({success: false, cancelled: true});

        }else if(orderStatus.status === 'Return Request'){
            return res.status(500).json({success: false, returnRequest: true});
        }else if(orderStatus.status === 'Return Request Rejected'){
            return res.status(500).json({success: false, returnRequestRejected: true});
        }else if(orderStatus.status === 'Approved Return Request'){
            return res.status(500).json({success: false, approvedReturnRequest: true});
        }else if(orderStatus.status === 'Returned'){
            return res.status(500).json({success: false, returned: true});
        }


        await Order.updateOne({_id: id},{$set: {status: 'Pending'}});


        res.status(200).json({success: true});

        
    } catch (error) {

        console.error('Error: ',error);
        res.redirect('/pageerror')
        
    }
}



const orderShipping = async (req,res)=>{
    try {

        let id = req.query.id;

        const orderStatus = await Order.findById(id);
       
        if(orderStatus.status === 'Delivered'){
            return res.status(500).json({success: false, delivered: true});
        }else if(orderStatus.status === 'Cancelled'){
            return res.status(500).json({success: false, cancelled: true});

        }else if(orderStatus.status === 'Return Request'){
            return res.status(500).json({success: false, returnRequest: true})
        }else if(orderStatus.status === 'Return Request Rejected'){
            return res.status(500).json({success: false, returnRequestRejected: true});
        }else if(orderStatus.status === 'Approved Return Request'){
            return res.status(500).json({success: false, approvedReturnRequest: true});
        }else if(orderStatus.status === 'Returned'){
            return res.status(500).json({success: false, returned: true});
        }

        await Order.updateOne({_id: id},{$set: {status: 'Shipping'}});
        res.status(200).json({success: true});
        
        
    } catch (error) {

        console.error('Error: ',error);
        res.redirect('/pageerror')
        
    }
}


const orderDelivered = async (req,res)=>{

    try {

        let id = req.query.id;

        const orderStatus = await Order.findById(id);
        

         if(orderStatus.status === 'Cancelled'){
            return res.status(500).json({success: false, cancelled: true});

        }else if(orderStatus.status === 'Return Request'){
            return res.status(500).json({success: false, returnRequest: true})
        }else if(orderStatus.status === 'Approved Return Request'){
            return res.status(500).json({success: false, approvedReturnRequest: true});
        }else if(orderStatus.status === 'Returned'){
            return res.status(500).json({success: false, returned: true});
        }else if(orderStatus.status === 'Return Request Rejected'){
            return res.status(500).json({success: false, returnRequestRejected: true});
        }
        
        const currentDate = new Date();
        const returnExpireDate = moment.tz(currentDate, "Asia/Kolkata").add(10, 'days');
        await Order.updateOne({_id: id},{$set: {status: 'Delivered' , paymentStatus: 'Paid', deliveryDate: currentDate , returnExpireDate: returnExpireDate}});
        res.status(200).json({success: true});
       
        
    } catch (error) {

        console.error('Error: ',error);
        res.redirect('/pageerror')
        
    }
    
}


const orderCancelled = async (req,res)=>{

    try {

        let id = req.query.id;

        const orderStatus = await Order.findById(id);
        

        if(orderStatus.status === 'Delivered'){
            return res.status(500).json({success: false, delivered: true});
        }else if(orderStatus.status === 'Return Request'){
            return res.status(500).json({success: false, returnRequest: true})
        }else if(orderStatus.status === 'Approved Return Request'){
            return res.status(500).json({success: false, approvedReturnRequest: true});
        }else if(orderStatus.status === 'Returned'){
            return res.status(500).json({success: false, returned: true});
        }else if(orderStatus.status === 'Return Request Rejected'){
            return res.status(500).json({success: false, returnRequestRejected: true});
        }

        await Order.updateOne({_id: id},{$set: {status: 'Cancelled'}});

       
        res.status(200).json({success: true});     
        
    } catch (error) {

        console.error('Error: ',error);
        res.redirect('/pageerror')
        
    }

}





const approvalOrderReturn = async (req,res)=>{
    try{
        let id = req.query.id;

        const orderStatus = await Order.findById(id);
        

        if(orderStatus.status !== 'Return Request' && orderStatus.status !== 'Return Request Rejected'){
            return res.status(500).json({success: false, noReturnRequest: true});

        }

        await Order.updateOne({_id: id},{$set: {status: 'Approved Return Request'}});
        res.status(200).json({success: true}); 

    }catch(error){
        console.log('Error: ',error);
        res.redirect('/admin/pageerror');
    }
}


const orderRejected = async (req,res)=>{
    try{
        let id = req.query.id;

        const orderStatus = await Order.findById(id);
        

        if(orderStatus.status !== 'Return Request'){
            return res.status(500).json({success: false, noReturnRequest: true});

        }

        await Order.updateOne({_id: id},{$set: {status: 'Return Request Rejected'}});
        res.status(200).json({success: true}); 

    }catch(error){
        console.log('Error: ',error);
        res.redirect('/admin/pageerror');
    }
}


const orderReturned = async (req,res)=>{
    try {

        let id = req.query.id;

        const orderStatus = await Order.findById(id);
       
        if(orderStatus.status === 'Return Request Rejected'){
            return res.status(500).json({success: false, returnRequestRejected: true});
        }else if(orderStatus.status !== 'Approved Return Request'){
            return res.status(500).json({success: false, notApproved: true});
        }

        await Order.updateOne({_id: id},{$set: {status: 'Returned'}});

        for(const item of orderStatus.orderItems){
            const product = await Product.findById(item.product._id);
            if(product){
                product.quantity += item.quantity;
            }

            if(product.quantity > 0){
                product.status = 'Available';
            }

            await product.save();
        }

      
        const userId = orderStatus.user;
        const finalAmount = orderStatus.finalAmount;
        const orderId = orderStatus.orderId;
        

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

        
        

        
        res.status(200).json({success: true});       
        
    } catch (error) {

        console.error('Error: ',error);
        res.redirect('/pageerror')
        
    }
}



const filterOrder = async (req,res)=>{
    try {
        const orderStatus = req.query.orderStatus;
        const page =  parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page -1) * limit;

        let orders;
        let totalFilteredOrders;

        if(orderStatus === 'All'){
            totalFilteredOrders = await Order.countDocuments();
            orders = await Order.find().populate('user').populate('orderItems.product')
            .skip(skip)
            .limit(limit)
            .sort({createdAt:-1});
            
        }
       else if(orderStatus){
            totalFilteredOrders = await Order.countDocuments({status: orderStatus});
            orders = await Order.find({status: orderStatus}).populate('user').populate('orderItems.product')
            .skip(skip)
            .limit(limit)
            .sort({createdAt:-1});
            

        }

        const totalPages = Math.ceil(totalFilteredOrders / limit)

        res.render('admin-orders',{
            orders: orders,
            currentPage: page,
            totalPages: totalPages,
            orderStatus: orderStatus
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}









module.exports = {
    getOrders,
    orderPending,
    orderShipping,
    orderDelivered,
    orderCancelled,
    approvalOrderReturn,
    orderReturned,
    orderRejected,
    filterOrder,
}