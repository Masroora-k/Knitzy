const Offer = require('../../models/offerSchema');
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const cron = require('node-cron');


const checkExpiredOffers = async (req,res)=>{
    try {

        const now = new Date();
        const expiredOffers = await Offer.find({endDate: {$lt: now}});


        for(const offer of expiredOffers){
            if(offer.offerType === 'Product'){
                await Product.findByIdAndUpdate(offer.productId,{
                    productOffer: null,
                    salePrice: offer.regularPrice
                });
            }else if(offer.offerType === 'Category'){
                const products = await Product.find({category: offer.categoryId});

                for(const product of products){
                    const newSalePrice = product.regularPrice;
                    await Product.findByIdAndUpdate(product._id,{
                        productOffer: null,
                        salePrice: newSalePrice
                    });
                }
            }
            await Offer.findByIdAndRemove(offer._id);
        }
        
    } catch (error) {

        console.error('Error in checking expired offers: ',error);
        
    }
};

cron.schedule('0 0 * * *',checkExpiredOffers);


const loadOfferPage = async (req,res)=>{
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page-1)*limit;

        const offerData = await Offer.find({})
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit);

        const totalOffers = await Offer.countDocuments();
        const totalPages = Math.ceil(totalOffers / limit);

        const categories = await Category.find({});
        const products = await Product.find({});

        res.render('admin-offers',{
            offers: offerData,
            currentPage: page,
            totalPages: totalPages,
            totalOffers: totalOffers,
            cat: categories,
            products: products
        })
        
    } catch (error) {

        console.error('Error in loadOfferPage');
        res.redirect('/admin/pageerror');
        
    } 
} 


const addOffer = async (req,res)=>{
    try {
        const {name,offerType,description,discountPercentage,startDate,endDate,status,productId,categoryId,termsAndConditions} = req.body;

        console.log('req.body: ',req.body)

        const existingOffer = await Offer.findOne({name});

    

        if(existingOffer){
            return res.status(400).json({error: 'Offer already exists'});
        }


        const newOfferData = {
            name,
            offerType,
            description,
            discountPercentage,
            startDate,
            endDate,
            status,
            termsAndConditions
        };

        
        if(offerType === 'Product'){
            const product = await Product.findById(productId);
            newOfferData.productId = product._id;
            const newOffer = new Offer(newOfferData);

            await newOffer.save();
    
            await Product.findByIdAndUpdate(productId,{productOffer: newOffer._id});

           


        }else if(offerType === 'Category'){
            console.log('Cat :',categoryId)
          const  category= await Category.findById(categoryId) ;
        newOfferData.categoryId = category._id;
        const newOffer = new Offer(newOfferData);

        await newOffer.save();

        const products = await Product.find({category: categoryId});

        for (const product of products) {
           
            
            await Product.findByIdAndUpdate(product._id, { 
                productOffer: newOffer._id, 
            });
        }

        }

    

        return res.json({message: 'Offer added successfully'});

        
    } catch (error) {

        console.log('Error in add new offer: ',error)
        return res.status(500).json({error: 'Internal Server Error'});
        
    }
}


const getEditOffer = async (req,res)=>{
    try {

        const id = req.query.id;
        const offer = await Offer.findOne({_id:id});

        const categories = await Category.find({});
        const products = await Product.find({});

        res.render('edit-offer',{
            offer:offer,
            cat: categories,
            products: products
        });
        
    } catch (error) {

        console.log('Error : ',error);
        res.redirect('/admin/pageerror');
        
    }
}


const EditOffer = async (req,res)=>{
    const { id } = req.params;
    const {
        name,
        description,
        offerType,
        productId,
        categoryId,
        discountPercentage,
        startDate,
        endDate,
        status,
        termsAndConditions,
    } = req.body;

    try {
        
        let offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).send('Offer not found');
        }

        const data = req.body;
        const existingOffer = await Offer.findOne({
            name: data.name,
            _id: {$ne: id}
        });
        if(existingOffer){
            return res.status(400).json({error: 'Offer with the same name already exists. Please try with another name'});
        }
        
        offer.name = name;
        offer.description = description;
        offer.offerType = offerType;
        offer.productId = offerType === 'Product' ? productId : null;
        offer.categoryId = offerType === 'Category' ? categoryId : null;
        offer.discountPercentage = discountPercentage;
        offer.startDate = new Date(startDate);
        offer.endDate = new Date(endDate);
        offer.status = status;
        offer.termsAndConditions = termsAndConditions;

    
        await offer.save();

    
       
        return res.status(200).json({ success: 'Offer updated successfully' });
     } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}


const deleteOffer = async (req,res)=>{
    try {

        const id = req.query.id;
         const offer = await Offer.findOne({_id:id});

         if(offer.offerType === 'Product'){
            await Product.findByIdAndUpdate(offer.productId, {
                productOffer: null,
            })
         }else if(offer.offerType === 'Category'){
            const products = await Product.find({category: offer.categoryId});

            for(const product of products){
                await Product.findByIdAndUpdate(product._id,{
                    productOffer: null,
                })
            }
         }

         await Offer.findOneAndDelete({_id:id});


        res.status(200).json({message: 'Offer deleted successfully'});

        
    } catch (error) {

        console.error('Error in delete offer: ',error);
        res.render('pageerror');
        
    }
}






module.exports = {
    loadOfferPage,
    addOffer,
    getEditOffer,
    EditOffer,
    deleteOffer,
} 