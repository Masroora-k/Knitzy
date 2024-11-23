const User = require('../../models/userSchema')
const Product = require('../../models/productSchema');
const Wishlist = require('../../models/wishlistSchema');


const addToWishlist = async (req, res) => {
    try {
      const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
  
      if (!userId) {
        return res.redirect('/login');
      }
  
      const productId = req.query.productId;
  
      if (!productId) {
        console.error('Product Id is missing');
        return res.status(400).send('Product Id is required');
      }
  
      let userWishlist = await Wishlist.findOne({ userId });
  
      if (!userWishlist) {
        console.log('Creating a new wishlist for user: ', userId);
        userWishlist = await Wishlist.create({ userId, products: [{ productId }] });
        return res.json({ added: true });
      }
  
      const isInWishlist = userWishlist.products.some(product => product.productId.toString() === productId);
  
      if (isInWishlist) {
        userWishlist.products = userWishlist.products.filter(product => product.productId.toString() !== productId);
        await userWishlist.save();
        return res.json({ added: false });
      } else {
        userWishlist.products.push({ productId });
        await userWishlist.save();
        return res.json({ added: true });
      }
    } catch (error) {
      console.error('Error in addToWishlist: ', error);
      res.status(500).send('Internal Server Error');
    }
  }
  


  const getWishlist = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
  
      if (!userId) {
        return res.redirect('/login');
      }

      const userWishlist = await Wishlist.findOne({userId}).populate('products.productId');

      res.render('wishlist',{
        user: userId,
        wishlist: userWishlist ? userWishlist.products : [],
        cartQuantity: req.session.cartQuantity || 0,

      })
        
    } catch (error) {
        console.error('Error in getting wishlist: ',error);
        res.status(500).send('Internal Server Error');
        
    }
  }


  const deleteWishlist = async (req, res) => {
    const { userId, productId } = req.body;

    try {
        const wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            console.error(`No wishlist found for userId: ${userId}`);
            return res.status(400).json({ message: 'Wishlist not found' });
        }

        const productIndex = wishlist.products.findIndex(item => item.productId.toString() === productId);

        if (productIndex > -1) {
            wishlist.products.splice(productIndex, 1);
            await wishlist.save();

            res.json({ success: true });
        } else {
            res.status(400).json({ message: 'Product not found in wishlist' });
        }
    } catch (error) {
        console.error('Error deleting item from wishlist:', error);
        res.status(500).json({ message: 'Server error' });
    }
};







module.exports = {
    addToWishlist,
    getWishlist,
    deleteWishlist

}