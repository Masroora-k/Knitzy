const User = require('../../models/userSchema')
const Coupon = require('../../models/couponSchema');
const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');
const moment = require('moment-timezone');
const Razorpay = require('razorpay');




const razorpayInstance = new Razorpay({
    key_id: 'rzp_test_MAimzLa32DUYt6', // Replace with your Razorpay Key ID
    key_secret: 'qbDDZBXaEQPNG72T9ZPVPytC' // Replace with your Razorpay Key Secret
  });
  
  const createRazorpayOrder = async (req, res) => {
    try {
      const totalAmount = req.session.totalAmount;
      const amountInPaise = totalAmount * 100; // Convert to paise
      console.log('Received CSRF Token:', req.body['_csrf']);
      const options = {
        amount: amountInPaise, 
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      };
  
      const order = await razorpayInstance.orders.create(options);
      
      if (!order) {
        return res.status(500).json({ success: false, message: 'Razorpay order creation failed' });
      }
 
      res.status(200).json({ success: true, orderId: order.id });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };
  




const getCheckout = async (req,res)=>{
  try {
    const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

    if (!userId) {
      return res.redirect('/login');
    }
    let order;
    let cart = await Cart.findOne({ userId }).populate('items.productId');

  

    let orderStatus ;
    if (req.query.order) {
      let orderId = req.query.order;

       order = await Order.findById(orderId).
      populate( 'orderItems.product').
      populate('couponId');


      orderStatus = order.status;
      if (!order) {
        return res.redirect('/cart');
      }

      
      req.session.totalAmount = order.finalAmount;
      req.session.discount = order.discount;
      req.session.orderId = order._id;

      if(order.couponApplied){
        req.session.couponCode = order.couponId.couponCode;
      }
      // Assign orderItems to cart.items
      cart = { items: order.orderItems.map(item => ({
        productId: item.product,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
      })) };
    } else if (!cart) {
      return res.redirect('/cart');
    }

    const user = await User.findById(userId);
    const address = await Address.findOne({ userId: userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let discount = req.session.discount || 0;

    console.log('total: ', req.session.totalAmount);

    const deliveryCharges = 0;

    res.render('checkout', {
      user: userId,
      cart: cart.items,
      totalAmount: req.session.totalAmount,
      discount,
      deliveryCharges,
      userAddress: address,
      order: orderStatus || null,
      cartQuantity: req.session.cartQuantity || 0,
    });

  } catch (error) {
    console.error('Error fetching checkout data:', error);
    res.status(500).json({ message: 'Error fetching checkout data' });
  }
}



const addAddress = async (req,res)=>{
    try {
        const user = req.session.user || (req.session.passport ? req.session.passport.user : null);

        res.render('checkoutAddAddress',{
            user: user,
            cartQuantity: req.session.cartQuantity || 0,
        })
        
    } catch (error) {

        res.redirect('/pageNotFound');
        
    }
}



const postAddAddress = async (req,res)=>{
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
        const userData = await User.findOne({_id: userId});
        const {address,name,city,landMark,state,pincode,phone,altPhone} = req.body;

        const userAddress = await Address.findOne({userId: userData._id});

        if(!userAddress){
            const newAddress = new Address({
                userId: userData._id,
                address: [{address,name,city,landMark,state,pincode,phone,altPhone}],
            })
            await newAddress.save();
        }else{
            userAddress.address.push({address,name,city,landMark,state,pincode,phone,altPhone});
            await userAddress.save();
        }


        res.redirect('/checkout');
    } catch (error) {

        console.error('Error in adding address: ',error);
        res.redirect('/pageNotFound');
        
    }
}


const editAddress = async (req,res)=>{
    try {

        const addressId = req.query.id;
        const user = req.session.user || (req.session.passport ? req.session.passport.user : null);

        const currentAddress = await Address.findOne({
            'address._id': addressId
        });

        if(!currentAddress){
            return res.redirect('/pageNotFound')
        }

        const addressData = currentAddress.address.find((item)=>{
            return item._id.toString()===addressId.toString();
        })

        if(!addressData){
            return res.redirect('/pageNotFound')
        }

        res.render('checkoutEditAddress',{address: addressData,user: user,
            cartQuantity: req.session.cartQuantity || 0,});
        
    } catch (error) {

        console.error('Error in edit address: ',error);
        res.redirect('/pageNotFound');
        
    }
}

const postEditAddress = async (req,res)=>{
    try {

        const data = req.body;
        console.log('Data: ',data);
        const addressId = req.params.id;
        console.log('AddressId: ',addressId);
        
        const findAddress = await Address.findOne({'address._id': addressId});
        console.log('FindAddress: ',findAddress);

        if(!findAddress){
           return res.redirect('/pageNotFound');
        }
        await Address.updateOne(
            {'address._id': addressId},
            {$set: {
                'address.$': {
                    _id: addressId,
                    address: data.address,
                    name: data.name,
                    city: data.city,
                    landMark: data.landMark,
                    state: data.state,
                    pincode: data.pincode,
                    phone: data.phone,
                    altPhone: data.altPhone
                }
            }}
        )

        res.redirect('/checkout');
        
    } catch (error) {

        console.error('Error in edit address: ',error);
        res.redirect('/pageNotFound'); 
        
    }
}


const deleteAddress = async (req,res)=>{
    try {

        const addressId = req.query.id;
        const findAddress = await Address.findOne({'address._id':addressId});

        if(!findAddress){
            return res.status(400).send('Address not found');
        }

        await Address.updateOne(
            {'address._id':addressId},
            {$pull: {
                address: {
                    _id: addressId
                }
            }}
        )

        res.redirect('/checkout');
        
    } catch (error) {

        console.erro('Error in delete address: ',error);
        res.redirect('/pageNotFound');
        
    }
}


const createOrder = async (req, res) => {
  try {
    const { userId, addressId, totalAmount, discount, finalAmount, } = req.body;

    console.log('Received data: ', req.body);

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    console.log('Cart: ',cart.items);
   

    const orderItems = cart.items.map(item => ({
      product: item.productId._id,
      quantity: item.quantity,
      price: item.productId.salePrice
    }));

    const order = new Order({
      user: userId,
      address: addressId,
      totalPrice: req.session.totalAmount,
      discount: req.session.discount || 0,
      finalAmount,
      orderItems,
      status: 'Pending',
      createdOn: new Date()
    });

    await order.save();

    
    await User.findByIdAndUpdate(userId, { cart: [] });

    res.status(200).json({ success: true, orderId: order._id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


const passAddress = async (req, res) => {
    try {
      const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
      
      // Get addressId from query parameters
      const addressId = req.query.addressId;
      console.log('addressId : ', addressId);
      
  
      if (!addressId) {
        return res.status(400).json({ success: false, message: 'Address ID is required.' });
      }

      const cart = await Cart.findOne({ userId }).populate('items.productId');
      
        
        
        if (!cart) {
            return res.redirect('/cart'); 
        }

       
        
        let discount = req.session.discount || 0;

       
        const totalAmount = req.session.totalAmount;
    

        const deliveryCharges = 0; 


      req.session.addressId = addressId;
      res.status(200).json({ success: true, message: 'Address confirmed for payment.',
                    user: userId,
                    addressId: req.session.addressId,
                    cartQuantity: req.session.cartQuantity || 0,
                    cart: cart.items,
                    discount,
                    totalAmount,
                    deliveryCharges,
      });
      
    } catch (error) {
      console.error('Error:', error);
      res.redirect('/checkout');
    }
  };

  


const getPlaceOrder = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        const paymentMethod = req.query.paymentMethod;
        console.log('parment method: ',paymentMethod);

        const cart = await Cart.findOne({ userId }).populate('items.productId');
      
        const addressId = req.session.addressId;
         console.log('AddressId: ',addressId);

        const addressDoc = await Address.findOne({'address._id':addressId});
        const address =  addressDoc.address.id(addressId); 
        console.log('Address: ',address)
        
        
        console.log('Address Id: ',address._id);

       
        
        let discount = req.session.discount || 0;

       
        const totalAmount = req.session.totalAmount;
    

        const deliveryCharges = 0; 
      
        res.render('placeOrder',{
            user: userId,
            address: address,
            cartQuantity: req.session.cartQuantity || 0,
            cart: cart.items,
            discount,
            totalAmount,
            deliveryCharges,
            paymentMethod,
        })

        
    } catch (error) {
        console.error('Error: ',error);
        res.redirect('/pageNotFound');
        
    }
}
  


const placeOrder = async (req, res) => {
    try {

     

      const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
      const cart = await Cart.findOne({ userId }).populate('items.productId');
  
      const addressId = req.session.addressId;
      console.log('AddressId: ', addressId);

  
      const addressDoc = await Address.findOne({'address._id': addressId});
      const address = addressDoc.address.id(addressId); 
      console.log('Address: ', address);

      if(req.session.orderId){
        const orderId = req.session.orderId;
        console.log('order id: ',orderId)
        const order = await Order.findById(orderId);

        if(!order){
          return res.status(400).json({sucess: false, message: 'Order not found'})
        }

        if(order.address.toString() !== addressId){
          const userAddress = {
            address: address.address,
            name: address.name,
            city: address.city,
            landMark: address.landMark,
            state: address.state,
            pincode: address.pincode,
            phone: address.phone,
            altPhone: address.altPhone
          };
          order.address = address._id;
          order.userAddress = [userAddress];
        }

        order.paymentStatus = 'Paid',
        order.status = 'Pending'
        await order.save();

        

        req.session.orderId = null;
        req.session.totalAmount = null;
      req.session.discount = null;
      req.session.couponCode = null;

        return res.status(200).json({success: true, orderId: order.orderId, cartQuantity: req.session.cartQuantity || 0 })
      }else{
  
      const totalAmount = req.session.totalAmount;
      const discount = req.session.discount || 0;
  
      const orderItems = cart.items.map(item => ({
        product: item.productId._id,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.price * item.quantity
      }));
  
      const itemsTotalPrice = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  
      const deliveryDate = moment.tz(new Date(), "Asia/Kolkata").add(8, 'days').startOf('day').toDate();

      const returnExpireDate = moment.tz(deliveryDate, "Asia/Kolkata").add(10, 'days');

      console.log('paymentMethod: ',req.query.paymentMethod)
     const paymentMethod = req.query.paymentMethod;
      let paymentStatus = 'Pending';
     if(paymentMethod === 'Online'){
        paymentStatus = 'Paid';
     }
      
  
      const userAddress = {
        address: address.address,
        name: address.name,
        city: address.city,
        landMark: address.landMark,
        state: address.state,
        pincode: address.pincode,
        phone: address.phone,
        altPhone: address.altPhone
      };
  
      let couponApplied = 'false';
      console.log('Coupon session: ',req.session.couponCode)
      let coupon;
      if(req.session.couponCode){
        const couponCode = req.session.couponCode;
        couponApplied = 'true';
        const couponData = await Coupon.findOne({couponCode: couponCode});
        coupon = couponData._id;
        console.log('coupon: ',coupon);
      }

  

      const order = new Order({
        user: userId,
        address: address._id,
        totalPrice: itemsTotalPrice,
        discount,
        finalAmount: totalAmount,
        orderItems,
        userAddress: [userAddress],
        status: 'Pending',
        paymentMethod: req.query.paymentMethod || 'COD',
        paymentStatus: paymentStatus,
        deliveryDate,
        returnExpireDate,
        couponApplied: couponApplied,
        invoiceDate: moment().tz("Asia/Kolkata").toDate(),
        createdAt: moment().tz("Asia/Kolkata").toDate()
      });
  
      // Save the order to DB
      await order.save();
      req.session.totalAmount = null;
      req.session.discount = null;
      req.session.couponCode = null;
  
      // Update stock
      for (const item of cart.items) {
        const product = await Product.findById(item.productId._id);
        if (product) {
          product.quantity -= item.quantity;

          if(product.quantity === 0){
            product.status = 'Out of stock'
          }
          await product.save();
        }
      }

      
      if(order.couponApplied){
        const couponDoc = await Coupon.findById(coupon);
        
        if(couponDoc){
            couponDoc.totalUsers +=1;
            couponDoc.userId.push(userId);
            await couponDoc.save();

            order.couponId = coupon;
             await order.save();
        }
        
      }

      console.log('order id:',order.orderId);
      
      // Clear user cart
      await Cart.findOneAndUpdate({ userId }, { items: [] });
      req.session.cartQuantity = 0;
  
      res.status(200).json({ success: true, orderId: order.orderId, cartQuantity: req.session.cartQuantity || 0 });
    }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };
  


const getOrderSuccess = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
        
        

        const orderId = req.query.orderId;
        console.log('order id in s: ',orderId);

       


        const orderData = await Order.findOne({orderId: orderId});

        if(!orderData){
          throw new Error('Order not found!')
        }

        console.log('orderData: ',orderData);

        const deliveryDate = orderData.deliveryDate;

        console.log('delivery: ',deliveryDate)
        const formattedDeliveryDate = moment(deliveryDate).format('dddd, MMMM Do YYYY, h:mm A');
        console.log('delivery date: ',formattedDeliveryDate);

        res.render('orderSuccess',{
            user: userId,
            orderId: orderId,
            deliveryDate: formattedDeliveryDate,
            cartQuantity: req.session.cartQuantity || 0,
        })

        
    } catch (error) {

        console.error('Error: ',error);
        res.redirect('/pageNotFound');
        
    }
}



const handlePaymentFailure = async (req,res)=>{
  try {

    if(req.session.orderId){

      const orderId = req.session.orderId;
      const order = await Order.findById(orderId);
      return  res.status(200).json({ success: true, orderId: order.orderId, cartQuantity: req.session.cartQuantity || 0 });

    }

    const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    const addressId = req.session.addressId;
    console.log('AddressId: ', addressId);


    const addressDoc = await Address.findOne({'address._id': addressId});
    const address = addressDoc.address.id(addressId); 
    console.log('Address: ', address);

    const totalAmount = req.session.totalAmount;
    const discount = req.session.discount || 0;

    const orderItems = cart.items.map(item => ({
      product: item.productId._id,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.price * item.quantity
    }));

    const itemsTotalPrice = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const deliveryDate = moment.tz(new Date(), "Asia/Kolkata").add(8, 'days').startOf('day').toDate();

    const returnExpireDate = moment.tz(deliveryDate, "Asia/Kolkata").add(10, 'days');

    console.log('paymentMethod: ',req.query.paymentMethod)
   
    let paymentStatus = 'Pending';
   
    

    const userAddress = {
      address: address.address,
      name: address.name,
      city: address.city,
      landMark: address.landMark,
      state: address.state,
      pincode: address.pincode,
      phone: address.phone,
      altPhone: address.altPhone
    };

    let couponApplied = 'false';
    console.log('Coupon session: ',req.session.couponCode)
    let coupon;
    if(req.session.couponCode){
      const couponCode = req.session.couponCode;
      couponApplied = 'true';
      const couponData = await Coupon.findOne({couponCode: couponCode});
      coupon = couponData._id;
      console.log('coupon: ',coupon);
    }

    const order = new Order({
      user: userId,
      address: address._id,
      totalPrice: itemsTotalPrice,
      discount,
      finalAmount: totalAmount,
      orderItems,
      userAddress: [userAddress],
      status: 'Order Not Placed',
      paymentMethod: req.query.paymentMethod,
      paymentStatus: paymentStatus,
      deliveryDate,
      returnExpireDate,
      couponApplied: couponApplied,
      invoiceDate: moment().tz("Asia/Kolkata").toDate(),
      createdAt: moment().tz("Asia/Kolkata").toDate()
    });

    // Save the order to DB
    await order.save();
    req.session.totalAmount = null;
    req.session.discount = null;
    req.session.couponCode = null;

    

    
    if(order.couponApplied){
      const couponDoc = await Coupon.findById(coupon);
      
      if(couponDoc){
          couponDoc.totalUsers +=1;
          couponDoc.userId.push(userId);
          await couponDoc.save();

          order.couponId = coupon;
           await order.save();
      }
      
    }

    console.log('order id:',order.orderId);
    
    // Clear user cart
    await Cart.findOneAndUpdate({ userId }, { items: [] });
    req.session.cartQuantity = 0;

    res.status(200).json({ success: true, orderId: order.orderId, cartQuantity: req.session.cartQuantity || 0 });
    
  } catch (error) {

    console.error('Error in handlePaymentFailure: ',error);
    res.status(500).json({success: false, message: 'Internal Server error'})
    
  }
}








module.exports = {
    getCheckout,
    addAddress,
    postAddAddress,
    editAddress,
    postEditAddress,
    deleteAddress,
    createOrder,
    passAddress,
    getPlaceOrder,
    placeOrder,
    getOrderSuccess,
    createRazorpayOrder,
    handlePaymentFailure,
}




