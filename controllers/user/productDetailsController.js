const User = require('../../models/userSchema')
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const Review = require('../../models/reviewSchema');

    

const getProductInfo = async (req,res)=>{
    try {  console.log('prodDetails page ');
        const userId = req.session.passport ? req.session.passport.user : null;

        const user = req.session.user;
        
        const id = req.query.id;
        console.log(id); 
        
        const product = await Product.findOne({_id:id});
      
        const category = await Category.findOne({_id: product.category});
        let productData = await Product.find({
            isBlocked: false,
            category: category._id,
            quantity: {$gt: 0}
        })
        if(user){
            const userData = await User.findOne({id: user._id});
          return  res.render('productDetails',{
            user: userData,
            products:productData,
            product:product,
            cat:category, 
         });
        }else if(userId){
            const userData = await User.findById(userId);
          return  res.render('productDetails',{
                user: userData, 
                products: productData,
                product:product,
            cat:category,
            });
        }else{ 
             return  res.render('productDetails',{
            product:product,
            cat:category,
            products: productData,
            
        }) 
           
        }
      
    } catch (error) {  
        res.redirect('/pageNotFound');
    }
} 


const getReview = async (req,res)=>{
    try {
        const userId = req.session.passport ? req.session.passport.user : null;

        const user = req.session.user ;
         const id = req.query.id;

        const product = await Product.findOne({_id:id});
        const reviews = await Review.find({ product_id: id }).populate('user_id', 'name');

        

        let userData = null;
        if(user){
             userData = await User.findOne({id: user._id});
          
        }else if(userId){
            userData = await User.findById(userId);
           
        } 
          
        return  res.render('review',{
                user: userData || null,
                product:product, 
                reviews: reviews,
             });
       

    } catch (error) {
        console.error(error);
        res.redirect('/pageerror');
    }
}


const review = async (req,res)=>{
    
        try {
            const userId = req.session.passport ? req.session.passport.user : null;
            const user = req.session.user || (userId ? await User.findById(userId) : null);
        
            if (!user) {
              return res.status(401).json({ error: 'You need to be logged in to submit a review' });
            }
        
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
            res.status(500).json({ error: 'An error occurred while submitting your review' });
          }

}

module.exports = {
    getProductInfo,
    getReview,
    review,
}