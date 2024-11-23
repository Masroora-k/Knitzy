const User = require('../../models/userSchema')
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const Review = require('../../models/reviewSchema');
const Cart = require('../../models/cartSchema');
const Address = require('../../models/addressSchema');
const Order = require('../../models/orderSchema');
const moment = require('moment-timezone');



const getCheckout = async (req,res)=>{
    try {
      
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        if (!userId) {
            return res.redirect('/login'); 
        }

        
        const cart = await Cart.findOne({ userId }).populate('items.productId');
      
        
        
        if (!cart) {
            return res.redirect('/cart'); 
        }

        const user = await User.findById(userId); 
        const address = await Address.findOne({userId: userId});

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        
        let discount = 0;

        
       
        const totalAmount = cart.items.reduce((total, item) => {
            return total + (item.quantity * item.productId.salePrice);
          }, 0);
    

        
        const deliveryCharges = 0; 

        
        res.render('checkout', {
           user: userId,
            cart: cart.items,
            totalAmount: totalAmount,
            discount,
            deliveryCharges,
            userAddress: address,
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
            {'address._id':addressId},
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
      totalPrice: totalAmount,
      discount,
      finalAmount,
      orderItems,
      status: 'Pending',
      createdOn: new Date()
    });

    await order.save();

    // Clear user cart
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

       
        
        let discount = 0;

       
        const totalAmount = cart.items.reduce((total, item) => {
            return total + (item.quantity * item.productId.salePrice);
          }, 0);
    

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

  
  const getPayment = async (req,res)=>{
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
        const cart = await Cart.findOne({ userId }).populate('items.productId');
      
        
        
        if (!cart) {
            return res.redirect('/cart'); 
        }

       
        
        let discount = 0;

       
        const totalAmount = cart.items.reduce((total, item) => {
            return total + (item.quantity * item.productId.salePrice);
          }, 0);
    

        const deliveryCharges = 0; 
      
        res.render('payment',{
            user: userId,
            addressId: req.session.addressId,
            cartQuantity: req.session.cartQuantity || 0,
            cart: cart.items,
                 discount,
                    totalAmount,
                    deliveryCharges,
        })
    } catch (error) {

        console.erro('Error: ',error);
        res.redirect('/pageNotFound');
        
    }
  }


const getPlaceOrder = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
        const cart = await Cart.findOne({ userId }).populate('items.productId');
      
        const addressId = req.session.addressId;
         console.log('AddressId: ',addressId);

        const addressDoc = await Address.findOne({'address._id':addressId});
        const address =  addressDoc.address.id(addressId); 
        console.log('Address: ',address)
        
        
        console.log('Address Id: ',address._id);

       
        
        let discount = 0;

       
        const totalAmount = cart.items.reduce((total, item) => {
            return total + (item.quantity * item.productId.salePrice);
          }, 0);
    

        const deliveryCharges = 0; 
      
        res.render('placeOrder',{
            user: userId,
            address: address,
            cartQuantity: req.session.cartQuantity || 0,
            cart: cart.items,
            discount,
            totalAmount,
            deliveryCharges,
        })

        
    } catch (error) {
        console.error('Error: ',error);
        res.redirect('/pageNotFound');
        
    }
}
  


const placeOrder = async (req,res)=>{
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
        const cart = await Cart.findOne({ userId }).populate('items.productId');
      
        const addressId = req.session.addressId;
         console.log('AddressId: ',addressId);

        const addressDoc = await Address.findOne({'address._id':addressId});
        const address =  addressDoc.address.id(addressId); 
        
        console.log('Address: ',address)
        
        console.log('Address Id: ',address._id);
       
        const totalAmount = cart.items.reduce((total, item) => {
            return total + (item.quantity * item.productId.salePrice);
          }, 0);
    
          let discount = 0;
        
    const orderItems = cart.items.map(item => ({
        product: item.productId._id,
        quantity: item.quantity,
        price: item.productId.salePrice,
        totalPrice: item.productId.salePrice * item.quantity

      }));

      const deliveryDate = moment.tz(new Date(), "Asia/Kolkata").add(8, 'days').startOf('day').toDate();
     
  
      const order = new Order({
        user: userId,
        address: address._id,
        totalPrice: totalAmount,
        discount,
        finalAmount: totalAmount - discount,
        orderItems,
        status: 'Pending',
        paymentMethod: 'COD',
        paymentStatus: 'Pending',
        deliveryDate,
        invoiceDate: moment().tz("Asia/Kolkata").toDate(),
        createdAt: moment().tz("Asia/Kolkata").toDate()
      });
  
      await order.save();
  

      for(const item of cart.items){
          const product =  await Product.findById(item.productId._id);
            if(product){
                product.quantity -= item.quantity;
                await product.save();
            }
      }

      // Clear user cart
      await Cart.findOneAndUpdate({userId},{items: []});
      req.session.cartQuantity = 0;
      console.log('cartQuantity: ', req.session.cartQuantity)
  
      res.status(200).json({ success: true, orderId: order._id ,cartQuantity: req.session.cartQuantity || 0});
        
    } catch (error) {

        console.error('Error: ',error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
        
    }
}


const getOrderSuccess = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
        
        

        const orderId = req.query.orderId;
        console.log('order id: ',orderId);


        const orderData = await Order.findById(orderId);
        console.log('orderData: ',orderData);

        const deliveryDate = orderData.deliveryDate;

        
        const formattedDeliveryDate = moment(deliveryDate).tz("Asia/Kolkata").format('dddd, MMMM Do YYYY, h:mm A');


        res.render('orderSuccess',{
            user: userId,
            orderData: orderData,
            deliveryDate: formattedDeliveryDate,
            cartQuantity: req.session.cartQuantity || 0,
        })

        
    } catch (error) {

        console.error('Error: ',error);
        res.redirect('/pageNotFound');
        
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
    getPayment,
    getPlaceOrder,
    placeOrder,
    getOrderSuccess,
}