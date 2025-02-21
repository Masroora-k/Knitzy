const User = require('../../models/userSchema')
const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const Offer = require('../../models/offerSchema')


const addToCart = async (req, res) => {
  try {
    const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

    if (!userId) {
      return res.redirect('/login');
    }

    const productId = req.query.productId;
    let quantity = parseInt(req.query.quantity) || 1; // Get quantity from request, else default is sest to 1

    if (!productId) {
      return res.status(400).json({ status: "error", message: "Product ID is required" });
    }

    const productData = await Product.findById(productId);
    if (!productData) {
      return res.status(404).json({ status: "error", message: "Product not found" });
    }

    let cart = await Cart.findOne({ userId: userId });

    // Check for any applicable offers and if offer exist calc the amount and set the salePrice into cart as price.
    const currentDate = new Date();
    let salePrice = productData.salePrice;

    if (productData.productOffer) {
      const offer = await Offer.findById(productData.productOffer);
      if (offer && offer.status === 'Active' && currentDate >= new Date(offer.startDate) && currentDate <= new Date(offer.endDate)) {
        salePrice = productData.regularPrice - (productData.regularPrice * (offer.discountPercentage / 100));
        salePrice = Math.round(salePrice);
      }
    }

    if (!cart) {
      // If no cart exists, create a new one
      if (quantity > 5) {
        return res.status(400).json({ status: "error", message: "You can't add more than 5 units per product." });
      }

      cart = new Cart({
        userId: userId,
        items: [{ productId, quantity, price: salePrice, totalPrice: salePrice * quantity }]
      });

    } else {
      // Check if product already exists in cart
      const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);

      if (productIndex > -1) {
        let newQuantity = cart.items[productIndex].quantity + quantity;

        // Check if new quantity exceeds the limit
        if (newQuantity > 5) {
          return res.status(400).json({ status: "error", message: "You can't add more than 5 units per product." });
        }

        cart.items[productIndex].quantity = newQuantity;
        cart.items[productIndex].totalPrice = newQuantity * salePrice;
      } else {
        // If product does not exist in cart
        if (quantity > 5) {
          return res.status(400).json({ status: "error", message: "You can't add more than 5 units per product." });
        }
        
        cart.items.push({ productId, quantity, price: salePrice, totalPrice: salePrice * quantity });
      }
    }

    await cart.save();

    req.session.cartQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);

    res.status(200).json({
      message: "Product added to cart",
      cartQuantity: req.session.cartQuantity,
      remainingQuantity: productData.quantity,
      status: "success"
    });

  } catch (error) {
    console.error("Error in adding to cart: ", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};




const getCartPage = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        if(!userId){
         return res.redirect('/login');
        }
        
        let cart = await Cart.findOne({userId: userId}).populate({
          path: 'items.productId',
          populate: { path: 'productOffer' } 
        });

        if(!cart){
            cart = {items: []};
        }

        
        let totalPrice = cart.items.reduce((total, item) => {
          return total + (item.quantity * item.price);
        }, 0);
  
       
        req.session.totalAmount = totalPrice + 80;
       
       
  
        let totalAmount = 0;
  if(req.session.discount){
    let discount = req.session.discount;
      totalAmount = totalPrice - (totalPrice * (discount / 100));
      totalAmount = Math.round(totalAmount) + 80;
      req.session.totalAmount = totalAmount;
  }else{
    totalAmount =  req.session.totalAmount
  }
      

       

        res.render('cart',{
            user: userId,
            cart: cart.items,
            cartQuantity: req.session.cartQuantity,
            totalPrice: totalPrice,
            totalAmount: req.session.totalAmount,
            discount: req.session.discount || 0,
            couponCode: req.session.couponCode
        })
        
    } catch (error) {

      console.error('Error in get cart page: ',error);
      res.status(500).send('Internal Server Error');
        
    }
}


const cartUpdate = async (req,res)=>{
    const { userId, productId, action } = req.body;


    try {
      const cart = await Cart.findOne({ userId }).populate('items.productId');
      
  
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
  
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      const cartItem = cart.items.find(item => item.productId._id.toString() === productId);

  
      if (!cartItem) {
        return res.status(404).json({ message: 'Product not in cart' });
      }

      let productQuantity = product.quantity;
  
      if (action === 'increase') {
        if (cartItem.quantity >= 5) {
          return res.status(400).json({ message: 'Cannot add more than 5 of the same product' });
        }

       
        const checkProductQuantity = productQuantity - cartItem.quantity;
        if(checkProductQuantity < 1){
            return res.status(400).json({ message: 'Out of stock' });
        }

         cartItem.quantity += 1; 
         
         cartItem.totalPrice = cartItem.price * cartItem.quantity;

      } else if (action === 'decrease') {
        if (cartItem.quantity > 1) {
          cartItem.quantity -= 1;
          
        } else {
          return res.status(400).json({ message: 'Quantity cannot be less than 1' });
        }
      }
  
      await cart.save();

      
  
      let totalPrice = cart.items.reduce((total, item) => {
        return total + (item.quantity * item.price);
      }, 0);

      req.session.totalAmount = totalPrice + 80;

      let totalAmount = 0;
if(req.session.discount){
  let discount = req.session.discount;
    totalAmount = totalPrice - (totalPrice * (discount / 100));
    totalAmount = Math.round(totalAmount) + 80;
    req.session.totalAmount = totalAmount;
}else{
  totalAmount =  req.session.totalAmount
}

      req.session.cartQuantity = cart.items.reduce((acc,item)=> acc + item.quantity,0);

  
      res.json({
        message: 'Cart updated successfully',
        cart,
        totalPrice: totalPrice,
        totalAmount: req.session.totalAmount,
       cartQuantity: req.session.cartQuantity,
       discount: req.session.discount || 0,
      });
  
    } catch (error) {
        console.log('Error in cartUpdate: ',error)
      res.status(500).json({ message: 'Internal server error', error });
    }
}
 

const cartDelete = async (req,res)=>{
    const { userId, productId } = req.body;

    try {
      
      const cart = await Cart.findOne({ userId });  
      const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);
  
      if (productIndex > -1) {
       
        cart.items.splice(productIndex, 1);
        await cart.save();
  
        
        const totalAmount = cart.items.reduce((total, item) => total + item.productId.salePrice * item.quantity, 0);
        const discount = cart.discount || 0;

        req.session.totalAmount = totalAmount;
  
        req.session.cartQuantity = cart.items.length;
        res.json({
          success: true,
          totalAmount,
          discount,
          cartQuantity:  req.session.cartQuantity,
          
        });
      } else {
        res.status(400).json({ message: 'Product not found in cart' });
      }
    } catch (error) {
      console.error('Error deleting item from cart:', error);
      res.status(500).json({ message: 'Server error' });
    }
}

const cartValidate = async (req,res)=>{
  try {
    const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

    if (!userId) {
      return res.redirect('/login');
    }
    
    let cart = await Cart.findOne({ userId }).populate('items.productId');

   
    if(!cart || !cart.items || cart.items.length === 0){
      return res.status(400).json({success: false,
        message: 'Cart is empty',
     })
    }
  
      const outOfStock = cart.items.filter(item=> item.productId.status !== 'Available');

      if(outOfStock.length >0){
        return res.status(400).json({success: false,
           message: 'Some products in your cart are out of stock',
           outOfStockProducts: outOfStock.map(item=> item.productId.productName)
        })
      }

      const quantityExceedsStock = cart.items.filter(item => item.quantity > item.productId.quantity);

      if (quantityExceedsStock.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Some products in your cart have a quantity greater than the available stock',
          quantityExceedsProducts: quantityExceedsStock.map(item => item.productId.productName)
        });
      }
    
      res.status(200).json({success: true})

  } catch (error) {
    console.error('Error in cartValidate:', error);
    res.status(500).json({ message: 'Error in cart validatation' });
  }
}





module.exports = {
    addToCart,
    getCartPage,
    cartUpdate,
    cartDelete,
    cartValidate
}