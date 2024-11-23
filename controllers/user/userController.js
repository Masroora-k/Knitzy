const User = require('../../models/userSchema');
const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const Wishlist = require('../../models/wishlistSchema');
const env = require('dotenv').config();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const pageNotFound = async (req,res)=>{
    try {
        res.render('page-404');
        console.log('render 404 page');
        
    } catch (error) {
        res.redirect('/pageNotFound'); 
        console.log('Error in page-404');
               
    }
};

const loadHomepage = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
       
        
        const categories = await Category.find({isListed:true});
        let productData = await Product.find({
            isBlocked: false,
            category: {$in: categories.map(category=>category._id)},
            quantity: {$gt: 0}
        })

        productData.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
        productData = productData.slice(0,6);

        req.session.filteredProducts = null;

        const cart = await Cart.findOne({userId: userId}).populate('items.productId');
        const cartQuantity = cart ? cart.items.reduce((acc,item) => acc + item.quantity,0) : 0;
        req.session.cartQuantity = cartQuantity;

        let userWishlist = [];

        if(userId){
            const userData = await User.findById(userId);
            const wishlist = await Wishlist.findOne({userId});
            if(wishlist){
                userWishlist = wishlist.products.map(product=> product.productId.toString());
            }
          return  res.render('home',{
            user: userData,
            products:productData,
            cartQuantity: req.session.cartQuantity || 0,
            wishlist: userWishlist
         });
        }
        else {
            return res.render('home',{
                products: productData,
                wishlist: userWishlist
            });
        }
    } catch (error) {
        console.log('Home page not found',error);
        res.status(500).json({ error: 'Server error' });
        
    }
};

const loadSignup = async (req,res)=>{
    try {
        return res.render('signup') 
    } catch (error) {
        console.log('Home page not loading: ',error);
        res.status(500).send('Server Error');
        
    }
}


function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString();

}

async function sendVerificationEmail(email,otp){
    try {

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth:{
                user: process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD,
            }
        })

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'Verify your account',
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`,
        })

        return info.accepted.length > 0
        
    } catch (error) {
        console.error('Error sending email',error);
        console.error('Detailed error response:', error.response);
        return false;
    }
}

const signup = async (req,res)=>{

    try {
        
        const {name,phone,email,password,cPassword} = req.body;

        if(password !== cPassword){
            return res.render('signup',{message: 'Passwords do not match'});
        }

        const findUser = await User.findOne({email});

        if(findUser){
            return res.render('signup',{message: 'User with this email already exists'});
        }

        const otp = generateOtp();

        const emailSent = await sendVerificationEmail(email,otp);
        const user = req.session.user;

        if(user){
            const userData = await User.findOne({id: user._id});
            
            res.render('home',{user: userData});
        }

        if(!emailSent){
            return res.json('email-error');
        }

        req.session.userOtp = otp;
        console.log("Stored OTP in session:", req.session.userOtp);
        req.session.userData = {name,phone,email,password};

        res.render('verify-otp');
        console.log('OTP sent',otp);
        

    } catch (error) {

        console.error('Signup error',error);
        res.redirect('/pageNotFound');
        
    }

}


const securePassword = async (password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10);
        
        return passwordHash;
    } catch (error) {
        
    }
}


const verifyOtp = async (req,res)=>{

    try {
        console.log(req.body);
        const {otp} = req.body;

        console.log("Received OTP:", otp);

        if(otp === req.session.userOtp){
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
            })

            await saveUserData.save();

            req.session.user = saveUserData._id;

            res.json({success: true, redirectUrl: '/'}); 
        }else{
            res.status(400).json({success: false, message: 'Invalid OTp, Please try again'});

        }
    } catch (error) {
        
        console.error('Error Verifying OTP', error);
        res.status(500).json({success: false, message: 'An error occured'});

    }

}


const resendOtp = async (req,res)=>{
    try {

        const {email} = req.session.userData;

        if(!email){
            return res.status(400).json({success:false, message: 'Email not found in session'})
        }

        const otp = generateOtp();
        req.session.userOtp = otp;


        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
            console.log('Resend otp: ',otp);
            res.status(200).json({success:true, message: 'OTP Resend Successfully'});
        }else{
            res.status(500).json({success: false, message: 'Failed to resend otp. Please try again'});
        }
        
    } catch (error) {
        console.error('Error resending OTP',error);
        res.status(500).json({success: false, message: 'Internal Server Error. Please try again'})
    }
} 


const loadLogin = async (req,res)=>{

    try {

        if(!req.session.user){
            return res.render('login');
        }else {
            res.redirect('/');
        }
        
    } catch (error) {
        res.redirect('/pageNotFound');
    }

}

const login = async (req,res)=>{
    try {

        const {email,password} = req.body;

        const findUser = await User.findOne({isAdmin:0,email:email});

        if(!findUser){
            return res.render('login',{message: 'User not found'});
        }

        if(findUser.isBlocked){
            return res.render('login',{message: 'User is blocked by admin'});
        }

        const passwordMatch = await bcrypt.compare(password,findUser.password);

        if(!passwordMatch){
            return res.render('login',{message: 'Incorrect Password'});
        }

        req.session.user = findUser._id;
       
        res.redirect('/');
        
    } catch (error) {

        console.error('login error',error);
        res.render('login',{message: 'Login failed. Please try again'});
        
    }
}


const logout = async (req,res)=>{
    try {

        req.session.destroy((err)=>{
            if(err){
                console.log('Session desctruction error', err.message);
                return res.redirect('/pageNotFound');
            }

            return res.redirect('/login');
        })
        
    } catch (error) {

        console.error('Logout error',error);
        res.redirect('/paeNoteFound');
        
    }
}


const loadShoppingPage = async (req,res)=>{
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        const userData = await User.findById(userId);
        const categories = await Category.find({isListed: true});
        const categoryIds = categories.map((category)=>category._id.toString());
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page-1)*limit;
        const products = await Product.find({
            isBlocked: false,
            category: {$in: categoryIds},
            quantity: {$gt:0},
        }).sort({createdAt:-1}).skip(skip).limit(limit);

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

        res.redirect('/pageNotFound');
        
    }
}



const filter = async (req, res) => {
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        const category = req.query.category;
        const priceGt = parseInt(req.query.gt, 10);
        const priceLt = parseInt(req.query.lt, 10);

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

        if (!isNaN(priceGt) && !isNaN(priceLt)) {
            query.salePrice = { $gt: priceGt, $lt: priceLt };
        }

        let findProducts = await Product.find(query).lean();
        findProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const categories = await Category.find({ isListed: true });

        let itemsPerPage = 6;
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
        });

    } catch (error) {
        console.error('Error in unifiedFilter: ', error);
        res.redirect('/pageNotFound');
    }
};



const searchProduct = async (req, res) => {
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        const userData = await User.findById(userId);
        let search = req.body.query;

        console.log('Search product: ',search);

        const categories = await Category.find({ isListed: true }).lean();
        const categoryIds = categories.map(category => category._id.toString());

        let searchResult = [];
        if (req.session.filteredProducts && req.session.filteredProducts.length > 0) {
            searchResult = req.session.filteredProducts.filter(product =>
                product.productName && product.productName.toLowerCase().includes(search.toLowerCase())
            );

            console.log('Search result with sesseion: ',searchResult);
        } else {
            searchResult = await Product.find({
                productName: { $regex: '.*' + search + '.*', $options: 'i' },
                isBlocked: false,
                quantity: { $gt: 0 },
                category: { $in: categoryIds }
            });

            console.log('search result without session: ',searchResult)
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
            count: searchResult.length,
            query: req.query ,
            cartQuantity: req.session.cartQuantity || 0,
        });

    } catch (error) {
        console.error('Error: ', error);
        res.redirect('/pageNotFound');
    }
}






module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,
    loadShoppingPage,
    filter,
    searchProduct,
}; 