const User = require('../../models/userSchema')
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const Review = require('../../models/reviewSchema');
const Wishlist = require('../../models/wishlistSchema');

    

const getProductInfo = async (req,res)=>{
    try {  console.log('prodDetails page ');
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
        
        const id = req.query.id;
        console.log(id); 
        
        let product = await Product.findOne({_id:id}).populate('productOffer');
      
        const category = await Category.findOne({_id: product.category});
        let productData = await Product.find({
            isBlocked: false,
            category: category._id,
            quantity: {$gt: 0}
        }).populate('productOffer');

        const currentDate = new Date();

        if (product.productOffer) {
            const offer = product.productOffer;
            if (offer.status === 'Active' && currentDate >= new Date(offer.startDate) && currentDate <= new Date(offer.endDate)) {
                product.salePrice = product.regularPrice - (product.regularPrice * (offer.discountPercentage / 100));
                product.salePrice = Math.round(product.salePrice);
                console.log('Selected product salePrice: ', product.salePrice);
            }
        }

       productData = productData.map(product =>{
        if(product.productOffer){
            const offer = product.productOffer;

            if(offer.status === 'Active' && currentDate >= new Date(offer.startDate) && currentDate <= new Date(offer.endDate)){
                product.salePrice = product.regularPrice - (product.regularPrice * (offer.discountPercentage / 100));
                product.salePrice = Math.round(product.salePrice);
            console.log('product salePrice: ',product.salePrice)
                return product;
            }

        }
        
        return product;
       })

        
        productData.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
        productData = productData.slice(0,6);


        let userWishlist = [];
        if(userId){
            const userData = await User.findById(userId);
            const wishlist = await Wishlist.findOne({userId});

            if(wishlist){
                userWishlist = wishlist.products.map(product => product.productId.toString());
            }
          return  res.render('productDetails',{
                user: userData, 
                products: productData,
                product:product,
                cat:category,
                cartQuantity: req.session.cartQuantity || 0,
                wishlist: userWishlist
                
            });
        }else{ 
             return  res.render('productDetails',{
            product:product,
            cat:category,
            products: productData,
            wishlist: userWishlist
            
        }) 
           
        }
      
    } catch (error) {  
        res.redirect('/pageNotFound');
    }
} 


const getReview = async (req,res)=>{
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

       
         const id = req.query.id;

        const product = await Product.findOne({_id:id});
        const reviews = await Review.find({ product_id: id }).populate('user_id', 'name');

        

        let userData = null;
        console.log('User id: ',userId);
         if(userId){
            userData = await User.findById(userId);
           
        } 
          
        return  res.render('review',{
                user: userData || null,
                product:product, 
                reviews: reviews,
                cartQuantity: req.session.cartQuantity || 0,
             });
       

    } catch (error) {
        console.error(error);
        res.redirect('/pageerror');
    }
}


const review = async (req,res)=>{
    
        try {
            const userId = req.session.passport ? req.session.passport.user : null;
            const user =  await User.findById(userId);
        
            if (!user) {
              return res.status(401).json({ error: 'You need to be logged in to submit a review' });
            }
        
            console.log('User id: ',userId);
            console.log('User ID: ',user.name)

            const { product_id, review, rating } = req.body;
        
            const newReview = new Review({
              review,
              product_id,
              user_id: user._id,
              rating,
              status: 'approved' // Assuming you want to auto-approve reviews for now
            });
        
            await newReview.save();
        
            res.status(201).json({ message: 'Review submitted successfully', review: newReview });
          } catch (error) {
            console.log('Error in review: ',error)
            res.status(500).json({ error: 'An error occurred while submitting your review' });
          }

}

module.exports = {
    getProductInfo,
    getReview,
    review,
}