
const Order = require('../../models/orderSchema');




const getOrders = async (req,res)=>{
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page-1) * limit;

        const orderData = await Order.find({})
        .populate('user','name')
        .populate('address')
        .populate('orderItems.product')
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit);

        

        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);

        res.render('admin-orders',{
            orders: orderData,
            currentPage: page,
            totalPages: totalPages,
            totalOrders: totalOrders,
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
        console.log('OrderStatus: ',orderStatus);

        if(orderStatus.status === 'Delivered'){
            return res.status(500).json({success: false, delivered: true});
        }else if(orderStatus.status === 'Cancelled'){
            return res.status(500).json({success: false, cancelled: true});

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
        console.log('OrderStatus: ',orderStatus);

        if(orderStatus.status === 'Delivered'){
            return res.status(500).json({success: false, delivered: true});
        }else if(orderStatus.status === 'Cancelled'){
            return res.status(500).json({success: false, cancelled: true});

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
        console.log('OrderStatus: ',orderStatus);

         if(orderStatus.status === 'Cancelled'){
            return res.status(500).json({success: false, cancelled: true});

        }
        
        await Order.updateOne({_id: id},{$set: {status: 'Delivered'}});
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
        console.log('OrderStatus: ',orderStatus);

        if(orderStatus.status === 'Delivered'){
            return res.status(500).json({success: false, delivered: true});
        }

        await Order.updateOne({_id: id},{$set: {status: 'Cancelled'}});

       
        res.status(200).json({success: true});     
        
    } catch (error) {

        console.error('Error: ',error);
        res.redirect('/pageerror')
        
    }

}



const orderReturnReq = async (req,res)=>{
    try {

        let id = req.query.id;

        const orderStatus = await Order.findById(id);
        console.log('OrderStatus: ',orderStatus);

        if(orderStatus.status === 'Delivered'){
            return res.status(500).json({success: false, delivered: true});
        }else if(orderStatus.status === 'Cancelled'){
            return res.status(500).json({success: false, cancelled: true});

        }

        await Order.updateOne({_id: id},{$set: {status: 'Return Request'}});

        
        res.status(200).json({success: true});    
        
    } catch (error) {

        console.error('Error: ',error);
        res.redirect('/pageerror')
        
    }
}


const orderReturned = async (req,res)=>{
    try {

        let id = req.query.id;

        const orderStatus = await Order.findById(id);
        console.log('OrderStatus: ',orderStatus);

        if(orderStatus.status === 'Delivered'){
            return res.status(500).json({success: false, delivered: true});
        }else if(orderStatus.status === 'Cancelled'){
            return res.status(500).json({success: false, cancelled: true});

        }

        await Order.updateOne({_id: id},{$set: {status: 'Returned'}});

        
        res.status(200).json({success: true});       
        
    } catch (error) {

        console.error('Error: ',error);
        res.redirect('/pageerror')
        
    }
}


const paymentPending = async (req,res)=>{
    try {

        let id = req.query.id;

        const orderStatus = await Order.findById(id);
        console.log('OrderStatus: ',orderStatus);

        if(orderStatus.paymentStatus === 'Paid'){
            return res.status(500).json({success: false, paid: true});
        }

        await Order.updateOne({_id: id},{$set: {paymentStatus: 'Pending'}});

        res.status(200).json({success: true});       
        
    } catch (error) {

        console.error('Error: ',error);
        res.redirect('/pageerror')
        
    }
}



const paymentCompleted = async (req,res)=>{
    try {

        let id = req.query.id;
        await Order.updateOne({_id: id},{$set: {paymentStatus: 'Paid'}});

        
        res.status(200).json({success: true});       
        
    } catch (error) {

        console.error('Error: ',error);
        res.redirect('/pageerror')
        
    }
}









module.exports = {
    getOrders,
    orderPending,
    orderShipping,
    orderDelivered,
    orderCancelled,
    orderReturnReq,
    orderReturned,
    paymentPending,
    paymentCompleted
}