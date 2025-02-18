const User = require('../../models/userSchema');
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const Wishlist = require('../../models/wishlistSchema');


const loadShoppingPage = async (req,res)=>{
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        const userData = await User.findById(userId);
        const categories = await Category.find({isListed: true});
        const categoryIds = categories.map((category)=>category._id.toString());
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page-1)*limit;
        let products = await Product.find({
            isBlocked: false,
            category: {$in: categoryIds},
            quantity: {$gt:0},
        }).sort({createdAt:-1}).skip(skip).limit(limit).populate('productOffer');


        const currentDate = new Date();

        products = products.map(product => {
          if (product.productOffer) {
            const offer = product.productOffer;
    
            if (offer.status === 'Active' && currentDate >= new Date(offer.startDate) && currentDate <= new Date(offer.endDate)) {
              // Calculate the sale price based on the discount percentage
              product.salePrice = product.regularPrice - (product.regularPrice * (offer.discountPercentage / 100));
              product.salePrice = Math.round(product.salePrice);
            }
          }
          return product;
        });
        

        const totalProducts = await Product.countDocuments({
            isBlocked: false,
            category: {$in: categoryIds},
            quantity: {$gt: 0},
        }) 

        
        const totalPages = Math.ceil(totalProducts/limit);

        const categoriesWithIds = categories.map(category => ({_id: category._id,name: category.name}));
        

        req.session.filteredProducts = null;

        let userWishlist = [];
        const wishlist = await Wishlist.findOne({userId});

        if(wishlist){
            userWishlist = wishlist.products.map(product => product.productId.toString());
        }

        res.render('shop',{
            user: userData,
            products: products,
            category: categoriesWithIds,
            totalProducts: totalProducts,
            currentPage: page,
            totalPages: totalPages,
            query: req.query,
            cartQuantity: req.session.cartQuantity || 0,
            wishlist: userWishlist
        });
        
    } catch (error) {
        
        console.log('Error : ',error);
        res.redirect('/pageNotFound');
        
    }
}



const filter = async (req, res) => {
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        const category = req.query.category;
        const priceGt = parseInt(req.query.gt, 10);
        const priceLt = parseInt(req.query.lt, 10);
        const sort = req.query.order;

        const query = {
            isBlocked: false,
            quantity: { $gt: 0 }
        };

        let findCategory;

        if (category) {
            findCategory = await Category.findById(category);
            if (findCategory) {
                query.category = findCategory._id;
            }
        }

        let findProducts = await Product.find(query).populate('productOffer').lean();
        const currentDate = new Date();

        findProducts = findProducts.map(product => {
          if (product.productOffer) {
            const offer = product.productOffer;
    
            if (offer.status === 'Active' && currentDate >= new Date(offer.startDate) && currentDate <= new Date(offer.endDate)) {
              // Calculate the sale price based on the discount percentage
              product.salePrice = product.regularPrice - (product.regularPrice * (offer.discountPercentage / 100));
              product.salePrice = Math.round(product.salePrice);
            }
          }
          return product;
        });

        
        if (!isNaN(priceGt) && !isNaN(priceLt)) {
            findProducts = findProducts.filter(product=> {
                return product.salePrice > priceGt && product.salePrice < priceLt;
            });
        }


        if(sort === 'asc'){
            findProducts.sort((a,b)=> a.productName.localeCompare(b.productName, undefined, {sensitivity: 'base'}));
        }else if(sort === 'desc'){
            findProducts.sort((a,b)=> b.productName.localeCompare(a.productName, undefined, {sensitivity: 'base'}));
        }else{
             findProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

       

        const categories = await Category.find({ isListed: true });

        let itemsPerPage = 12;
        let currentPage = parseInt(req.query.page) || 1;
        let startIndex = (currentPage - 1) * itemsPerPage;
        let endIndex = startIndex + itemsPerPage;
        let totalPages = Math.ceil(findProducts.length / itemsPerPage);
        const currentProduct = findProducts.slice(startIndex, endIndex);

        let userData = null;
        if (userId) {
            userData = await User.findById(userId);
            if (userData) {
                const searchEntry = {
                    category: findCategory ? findCategory._id : null,
                    searchedOn: new Date(),
                };

                userData.searchHistory.push(searchEntry);
                await userData.save();
            }
        }

        let userWishlist = [];
        const wishlist = await Wishlist.findOne({userId});

        if(wishlist){
            userWishlist = wishlist.products.map(product => product.productId.toString());
        }
        req.session.filteredProducts = currentProduct;

        res.render('shop', {
            user: userData,
            products: currentProduct,
            category: categories,
            totalPages,
            currentPage,
            selectedCategory: category || null,
            query: req.query,
            cartQuantity: req.session.cartQuantity || 0,
            wishlist: userWishlist
        });

    } catch (error) {
        console.error('Error in unifiedFilter: ', error);
        res.redirect('/pageNotFound');
    }
};



const searchSuggestions = async (req,res)=>{
    try {
        const searchQuery = req.query.query || '';
        const categories = await Category.find({ isListed: true }).lean();
        const categoryIds = categories.map(category => category._id.toString());

        let searchResult = await Product.find({
            productName: { $regex: '.*' + searchQuery + '.*', $options: 'i' },
            isBlocked: false,
            quantity: { $gt: 0 },
            category: { $in: categoryIds }
        }).select('productName _id').lean();

        res.json(searchResult);
    } catch (error) {
        console.error('Error fetching search suggestions:', error);
        res.status(500).send('Internal Server Error');
    }
}



const searchProduct = async (req, res) => {
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        const userData = await User.findById(userId);
        let search = req.query.query || '';

        console.log('Search product:', search);

        const categories = await Category.find({ isListed: true }).lean();
        const categoryIds = categories.map(category => category._id.toString());

        let searchResult = [];
        if (req.session.filteredProducts && req.session.filteredProducts.length > 0) {
            searchResult = req.session.filteredProducts.filter(product =>
                product.productName && product.productName.toLowerCase().includes(search.toLowerCase())
            );

            console.log('Search result with session:', searchResult);
        } else {
            searchResult = await Product.find({
                productName: { $regex: '.*' + search + '.*', $options: 'i' },
                isBlocked: false,
                quantity: { $gt: 0 },
                category: { $in: categoryIds }
            }).populate('productOffer').lean();

            console.log('Search result without session:', searchResult);
        }

        const currentDate = new Date();

        searchResult = searchResult.map(product =>{
            if(product.productOffer){
                const offer = product.productOffer;

                if(offer.status === 'Active' && currentDate >= new Date(offer.startDate) && currentDate <= new Date(offer.endDate)){
                    product.salePrice = product.regularPrice - (product.regularPrice * (offer.discountPercentage /100));
                    product.salePrice = Math.round(product.salePrice);
                }
            }
            return product;
        })

        let userWishlist = [];
        const wishlist = await Wishlist.findOne({ userId });

        if (wishlist) {
            userWishlist = wishlist.products.map(product => product.productId.toString());
        }

        searchResult.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        let itemsPerPage = 12;
        let currentPage = parseInt(req.query.page) || 1;
        let startIndex = (currentPage - 1) * itemsPerPage;
        let endIndex = startIndex + itemsPerPage;
        let totalPages = Math.ceil(searchResult.length / itemsPerPage);
        const currentProduct = searchResult.slice(startIndex, endIndex);

        res.render('shop', {
            user: userData,
            products: currentProduct,
            category: categories,
            totalPages,
            currentPage,
            searchResult: searchResult,
            count: searchResult.length,
            query: req.query,
            cartQuantity: req.session.cartQuantity || 0,
            wishlist: userWishlist
        });

    } catch (error) {
        console.error('Error:', error);
        res.redirect('/pageNotFound');
    }
};

const searchAndFilter = async (req, res) => {
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
        const { query, category, gt, lt, order, page } = req.query;

        const searchQuery = query || '';
        const priceGt = parseInt(gt, 10);
        const priceLt = parseInt(lt, 10);
        const sort = req.query.order;
        const currentPage = parseInt(page) || 1;
        const itemsPerPage = 12;

        // Remove price and sorting filters if not present
        if (isNaN(priceGt) || isNaN(priceLt)) {
            delete req.query.gt;
            delete req.query.lt;
        }
        if (!sort) {
            delete req.query.order;
        }

        const dbQuery = {
            isBlocked: false,
            quantity: { $gt: 0 }
        };

        // Apply search filter if query is present
        if (searchQuery) {
            dbQuery.productName = { $regex: '.*' + searchQuery + '.*', $options: 'i' };
        }

        // Apply category filter if category is present
        if (category) {
            const findCategory = await Category.findById(category);
            if (findCategory) {
                dbQuery.category = findCategory._id;
            }
        }

        let findProducts = await Product.find(dbQuery).populate('productOffer').lean();
        const currentDate = new Date();

        // Apply product offers if available
        findProducts = findProducts.map(product => {
            if (product.productOffer) {
                const offer = product.productOffer;
                if (offer.status === 'Active' && currentDate >= new Date(offer.startDate) && currentDate <= new Date(offer.endDate)) {
                    product.salePrice = product.regularPrice - (product.regularPrice * (offer.discountPercentage / 100));
                    product.salePrice = Math.round(product.salePrice);
                }
            }
            return product;
        });

        // Apply price filter if both gt and lt are present
        if (!isNaN(priceGt) && !isNaN(priceLt)) {
            findProducts = findProducts.filter(product => {
                return product.salePrice > priceGt && product.salePrice < priceLt;
            });
        }

        // Apply sorting
        if (order === 'asc') {
            findProducts.sort((a, b) => a.productName.localeCompare(b.productName, undefined, { sensitivity: 'base' }));
        } else if (order === 'desc') {
            findProducts.sort((a, b) => b.productName.localeCompare(a.productName, undefined, { sensitivity: 'base' }));
        } else {
            findProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        const categories = await Category.find({ isListed: true });

        // Apply pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const totalPages = Math.ceil(findProducts.length / itemsPerPage);
        const currentProduct = findProducts.slice(startIndex, endIndex);

        let userWishlist = [];
        const wishlist = await Wishlist.findOne({ userId });
        if (wishlist) {
            userWishlist = wishlist.products.map(product => product.productId.toString());
        }

        req.session.filteredProducts = currentProduct;

        res.render('shop', {
            user: await User.findById(userId),
            products: currentProduct,
            category: categories,
            totalPages,
            currentPage,
            searchResult: findProducts,
            count: findProducts.length,
            query: req.query,
            cartQuantity: req.session.cartQuantity || 0,
            wishlist: userWishlist
        });

    } catch (error) {
        console.error('Error in searchAndFilter API:', error);
        res.redirect('/pageNotFound');
    }
};



module.exports = {
    loadShoppingPage,
    filter,
    searchSuggestions,
    searchProduct,
    searchAndFilter
}; 