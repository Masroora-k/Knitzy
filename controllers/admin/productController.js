const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const Offer = require('../../models/offerSchema');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const getProduct = async (req,res)=>{
    try {
        const searchQuery = req.query.query || '';  
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        
        const query = {
            $or: [
                { productName: { $regex: searchQuery, $options: 'i' } },  // Search by product name
                { description: { $regex: searchQuery, $options: 'i' } },  // Optionally search by description
            ]
        };

       
        const productData = await Product.find(query)
            .populate('category')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        const category = await Category.find({ isListed: true });

        
        if (category) {
            res.render('products', {
                data: productData,
                currentPage: page,
                totalPages: totalPages,
                totalProducts: totalProducts,
                cat: category,
                query: searchQuery
            });
        } else {
            res.render('page-404');
        }

    } catch (error) {
        console.log('Error : ', error);
        res.redirect('/admin/pageerror');
    }
}

const addProducts = async (req,res)=>{
    try {

        const products = req.body;
        const productExists = await Product.findOne({
            productName: products.productName,

        })
        if(productExists){
            return res.status(400).json({message: 'Product already exist, please try another name'});
        }
            const images = [];

            if(req.files && req.files.length>0){
                for(let i=0; i<req.files.length; i++){
                    const originalImagePath = req.files[i].path;

                   
                    const timestamp = Date.now();
                    const resizedImageName = `resized-${timestamp}-${req.files[i].filename}`;
                    const resizedImagePath = path.join(__dirname,'../../public/uploads/product-images',resizedImageName);

                    try {

                        await sharp(originalImagePath)
                        .resize({width: 440, height: 440})
                        .toFile(resizedImagePath);

                        images.push(`/uploads/product-images/${resizedImageName}`);
                        
                    } catch (error) {

                        console.error('Error',error);
                        res.redirect('/admin/pageerror');
                        
                    }

                    
                }
            }

            const categoryId =await Category.findOne({name:products.category});

            if(!categoryId){
                return res.status(400).json('Invalid category name');
            }
            


            const offers = await Offer.find({
               offerType: 'Category',
               categoryId: categoryId._id,  
               status: 'Active'
                
                
            });

            let applicableOffer = null;

            for(const offer of offers){
                if(offer.offerType === 'Category'){
                    applicableOffer = offer;
                    break;
                }
            }


            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                quantity: products.quantity,
                size: products.size,
                color: products.color,
                productImage: images,
                status: 'Available',
                productOffer: applicableOffer ? applicableOffer._id : null,

            });

            await newProduct.save();
            return res.redirect('/admin/products');

       
        
    } catch (error) {

        console.error('Error saving product',error);
        return res.redirect('/admin/pageerror');
        
    }
}


const blockProduct = async (req,res)=>{
    try {

        let id = req.query.id;
        await Product.updateOne({_id:id},{$set: {isBlocked: true}});
        res.redirect('/admin/products');
        
    } catch (error) {

        res.redirect('/pageerror');
        
    }
}

const unblockProduct = async (req,res)=>{
    try {

        let id = req.query.id;
        await Product.updateOne({_id:id},{$set: {isBlocked: false}});
        res.redirect('/admin/products');
        
    } catch (error) {
        res.redirect('pageerror');
        
    }
}


const prodAvailable = async (req,res)=>{
    try {

        let id = req.query.id;
        await Product.updateOne({_id:id},{$set: {status: 'Available'}});
        res.redirect('/admin/products');
        
    } catch (error) {
        res.redirect('pageerror');
        
    }
}


const prodOutOfStock = async (req,res)=>{
    try {

        let id = req.query.id;
        await Product.updateOne({_id:id},{$set: {status: 'Out of stock'}});
        res.redirect('/admin/products');
        
    } catch (error) {
        res.redirect('pageerror');
        
    }
}


const prodDiscontinued = async (req,res)=>{
    try {

        let id = req.query.id;
        await Product.updateOne({_id:id},{$set: {status: 'Discontinued'}});
        res.redirect('/admin/products');
        
    } catch (error) {
        res.redirect('pageerror');
        
    }
}

const getEditProduct = async (req,res)=>{
    try {

        const id = req.query.id;
        
        const product = await Product.findOne({_id:id}).populate('category');
        const category = await Category.find({});
       return  res.render('edit-product',{
            product:product,
            cat:category,
        })
        
    } catch (error) {

        res.redirect('/admin/pageerror');
        
    }
}


const editProduct = async (req,res)=>{
    try {

        const id = req.params.id;
        const product = await Product.findOne({_id:id});
        const data = req.body;
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id:{$ne:id}
        });

        if(existingProduct){
            return res.status(400).json({error:'Product with the same name already exists. Please try with another name'})
        }

        const images = [];

        if(req.files &&   req.files.length>0){

            for(let i=0; i<req.files.length; i++){
                const originalImagePath = req.files[i].path;

               
                const timestamp = Date.now();
                const resizedImageName = `resized-${timestamp}-${req.files[i].filename}`;
                const resizedImagePath = path.join(__dirname,'../../public/uploads/product-images',resizedImageName);

                try {

                    await sharp(originalImagePath)
                    .resize({width: 440, height: 440})
                    .toFile(resizedImagePath);

                   
                        

                    images.push(`/uploads/product-images/${resizedImageName}`);
                  
                    
                } catch (error) {

                    console.error('Error',error);
                    res.redirect('/admin/pageerror');
                    
                }

                
            }
        }

        let status;
        if(data.quantity <=0){
             status = 'Out of stock';
        }else{
            status = 'Available';
        }

        const updateFields = {
            productName: data.productName,
            description: data.description,
            category: product.category,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            size: data.size,
            color: data.color,
            status: status,
        }
        
        if(req.files.length>0){
            updateFields.$push = {productImage: {$each: images}};

        }

        await Product.findByIdAndUpdate(id,updateFields,{new:true});
        res.redirect('/admin/products');

    } catch (error) {

        console.error(error);
        res.redirect('/admin/pageerror');
        
    }
}


const deleteSingleImage = async (req,res)=>{
    try {

        const {imageNameToServer,productIdToServer} = req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}});

        if (!product) {
            return res.status(404).send({ status: false, message: 'Product not found' });
        }

        const imagePath = path.join(__dirname,'../../public/uploads/product-images',path.basename(imageNameToServer));
       

        if(fs.existsSync(imagePath)){
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted successfully`);  
        }else {
            console.log(`Image ${imageNameToServer} not found`);
        }

        res.json({status:true, redirectUrl: '/editProduct'});
        
    } catch (error) {

        res.redirect('/admin/pageerror');
        
    }
}



const deleteProduct = async (req,res)=>{
    try {

        const id = req.query.id;
       
        await Product.findOneAndDelete({_id:id});

        res.status(200).json({ message: 'Product deleted successfully' });
        
        
    } catch (error) {
        res.render('pageerror');
        
    }
}


const productSuggestions = async (req,res)=>{
    try {
        const searchQuery = req.query.query || '';
        let searchResult = await Product.find({
            productName: { $regex: '.*' + searchQuery + '.*', $options: 'i' },
        }).select('productName _id').lean();

        res.json(searchResult);
    } catch (error) {
        console.error('Error fetching search suggestions:', error);
        res.status(500).send('Internal Server Error');
    }
}


const productSearch = async (req,res)=>{
    try {
        const query = req.query.query || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        // Define the search query
        const searchQuery = {
            productName: { $regex: '.*' + query + '.*', $options: 'i' }
        };

        // Get the search results based on the search query with pagination
        const searchResult = await Product.find(searchQuery)
            .populate('category')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Calculate the total number of products based on the search query
        const totalProducts = await Product.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalProducts / limit);

        // Get the list of categories
        const category = await Category.find({ isListed: true }).lean();

       
        res.render('products', {
            data: searchResult,
            query,
            currentPage: page,
            totalPages: totalPages,
            totalProducts: totalProducts,
            cat: category,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
}






module.exports = {
    getProduct,
    addProducts,
    blockProduct,
    unblockProduct,
    prodAvailable,
    prodOutOfStock,
    prodDiscontinued,
    getEditProduct,
    editProduct,
    deleteSingleImage,
    deleteProduct,
    productSuggestions,
    productSearch
}