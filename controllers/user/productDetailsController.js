
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');

  

const getProductInfo = async (req,res)=>{
    try {  console.log('prodDetails page ');
        const id = req.query.id;
        console.log(id);
        
        const product = await Product.findOne({_id:id});
      
        const category = await Category.findOne({_id: product.category});
        let productData = await Product.find({
            isBlocked: false,
            category: category._id,
            quantity: {$gt: 0}
        })
       return  res.render('productDetails',{
            product:product,
            cat:category,
            products: productData,
            
        }) 
        
    } catch (error) {  
        res.redirect('/pageNotFound');
    }
}



module.exports = {
    getProductInfo,
}