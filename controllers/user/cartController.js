const User = require('../../models/userSchema')
const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');





const addToCart= async (req,res)=>{
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

       if(!userId){
        return res.redirect('/login');
       }

       const productId = req.query.productId;
       const productData = await Product.findById(productId);
       if(!productId){
        return res.status(400).send('Product ID is required');
       }

       let cart = await Cart.findOne({userId: userId});

       if(cart){
        const productIndex = cart.items.findIndex(item=> item.productId.toString() === productId);
        if(productIndex > -1){

            if(productData.quantity < 1){
                return res.status(400).json({message: 'Out of stock'})
            }

            cart.items[productIndex].quantity += 1;
            cart.items[productIndex].totalPrice = cart.items[productIndex].quantity * cart.items[productIndex].price;
            console.log('total price: ',cart.items[productIndex].totalPrice)
        }else{
            if(productData.quantity <1){
                return res.status(400).json({message: 'Out of stock'});
            }
            cart.items.push({productId: productId, quantity: 1, price: productData.salePrice, totalPrice: productData.salePrice});
        }
       }else {
            cart = new Cart({
                userId: userId,
                items: [{productId: productId, quantity: 1, price: productData.salePrice, totalPrice: productData.salePrice}]
            });
       }

       

       if(productData.quantity === 0){
        productData.status = 'Out of stock';
       }

       
 
       await cart.save();


       req.session.cartQuantity = cart.items.reduce((acc,item)=> acc + item.quantity,0);

       console.log('Updated cart quantity: ',req.session.cartQuantity);


       res.status(200).json({message: 'Product added to cart',
         cartQuantity: req.session.cartQuantity,
          remainingQuantity: productData.quantity,
          status: productData.status
        });


         
        
    } catch (error) {

        console.error('Error in adding to cart: ',error);
        res.status(500).json({message: 'Internal Server Error'});
        
    }
}


const getCartPage = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        if(!userId){
         return res.redirect('/login');
        }
        
        let cart = await Cart.findOne({userId: userId}).populate('items.productId');

        if(!cart){
            cart = {items: []};
        }


       
      const totalAmount = cart.items.reduce((total, item) => {
        return total + (item.quantity * item.productId.salePrice);
      }, 0);

      const discount = 0; 

        res.render('cart',{
            user: userId,
            cart: cart.items,
            cartQuantity: req.session.cartQuantity,
            totalAmount: totalAmount,
            discount: discount
        })
        
    } catch (error) {
        
    }
}


const cartUpdate = async (req,res)=>{
    const { userId, productId, action } = req.body;

    console.log('userId:',userId);
    console.log('productId: ',productId);
    console.log('action: ',action);

    try {
      const cart = await Cart.findOne({ userId }).populate('items.productId');
      console.log('Cart: ',cart);
  
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
      console.log('product quantiy: ',product.quantity);
  
      if (action === 'increase') {
        if (cartItem.quantity >= 5) {
          return res.status(400).json({ message: 'Cannot add more than 5 of the same product' });
        }

        console.log('cart quantity: ',cartItem.quantity);
       
        const checkProductQuantity = productQuantity - cartItem.quantity;
        if(checkProductQuantity < 1){
            return res.status(400).json({ message: 'Out of stock' });
        }

         cartItem.quantity += 1; 
         
         cartItem.totalPrice = cartItem.price * cartItem.quantity;
         console.log('totalPrice: ',cartItem.totalPrice )

      } else if (action === 'decrease') {
        if (cartItem.quantity > 1) {
          cartItem.quantity -= 1;
          
        } else {
          return res.status(400).json({ message: 'Quantity cannot be less than 1' });
        }
      }
  
      await cart.save();
  
      const totalAmount = cart.items.reduce((total, item) => {
        return total + (item.quantity * item.productId.salePrice);
      }, 0);

      const discount = 0;

      req.session.cartQuantity = cart.items.reduce((acc,item)=> acc + item.quantity,0);

       console.log('Updated cart quantity: ',req.session.cartQuantity);
  
      res.json({
        message: 'Cart updated successfully',
        cart,
        totalAmount,
       cartQuantity: req.session.cartQuantity,
       discount,
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
        // Remove the product from the cart
        cart.items.splice(productIndex, 1);
        await cart.save();
  
        
        const totalAmount = cart.items.reduce((total, item) => total + item.productId.salePrice * item.quantity, 0);
        const discount = cart.discount || 0;
  
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







module.exports = {
    addToCart,
    getCartPage,
    cartUpdate,
    cartDelete,
}