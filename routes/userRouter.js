const express = require('express');
const router = express.Router();
const passport = require('passport');
const userController =require('../controllers/user/userController');
const profileController = require('../controllers/user/profileController');
const productDetailsController = require('../controllers/user/productDetailsController');
const cartController = require('../controllers/user/cartController');
const checkoutController = require('../controllers/user/checkoutController');
const orderController = require('../controllers/user/orderController');
const wishlistController = require('../controllers/user/wishlistController');

const {userAuth,adminAuth} = require('../middlewares/auth');


router.get('/pageNotFound',userController.pageNotFound);
router.get('/',userController.loadHomepage);
router.get('/signup',userController.loadSignup);
router.post('/signup',userController.signup);
router.post('/verify-otp',userController.verifyOtp);
router.post('/resend-otp',userController.resendOtp);
router.get('/auth/google',passport.authenticate('google',{scope: ['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect: '/signup'}),(req,res)=>{
    req.session.userId = req.user._id;
    req.session.username = req.user.username;
    res.redirect('/');
}); 
router.get('/login',userController.loadLogin);
router.post('/login',userController.login);
router.get('/logout',userController.logout);

router.get('/forgot-password',profileController.getForgotPassPage);
router.post('/forgot-email-valid', (req, res, next) => {
    console.log('post request for forgot pass');
    next();
},profileController.forgotEmailValid);
router.post('/verify-passForgot-otp',profileController.verifyForgotPassOtp);
router.get('/reset-password',profileController.getResetPassPage);
router.post('/resend-forgot-otp',profileController.resendOtpToForgotPass);
router.post('/reset-password',profileController.postNewPassword);

//product details
router.get('/productDetails',productDetailsController.getProductInfo);
router.get('/review',productDetailsController.getReview);
router.post('/review',productDetailsController.review);
 
//user profile management
router.get('/userProfile',userAuth,profileController.userProfile);
router.get('/changeProfile',userAuth,profileController.getChangeProfile);
router.post('/changeProfile',userAuth,profileController.changeProfile);

router.post('/changeProfile-verify-otp', (req, res, next) => {
    console.log('post request for verify otp');
    next();
}, userAuth,profileController.verifyProfileOtp);
router.post('/resendOtpToChangeProfile', (req, res, next) => {
    console.log('post request for resend otp');
    next();
}, userAuth,profileController.resendOtpToChangeProfile);

router.get('/new-profile',userAuth,profileController.getNewProfile);
router.patch('/updateProfile',userAuth,profileController.updateProfile);


//Address Management

router.get('/addAddress',userAuth,profileController.addAddress);
router.post('/addAddress',userAuth,profileController.postAddAddress);
router.get('/editAddress',userAuth,profileController.editAddress);
router.post('/editAddress/:id',userAuth,profileController.postEditAddress);
router.get('/deleteAddress',userAuth,profileController.deleteAddress);

//shope page
router.get('/shop',userAuth,userController.loadShoppingPage); 


router.get('/filter',userAuth,userController.filter);
router.get('/filterPrice',userAuth,userController.filter);

//Search 
router.post('/search',userAuth,userController.searchProduct);


//Cart page
router.get('/addToCart',userAuth,cartController.addToCart);
router.get('/cart',userAuth,cartController.getCartPage);
router.patch('/cartUpdate',userAuth,cartController.cartUpdate);
router.delete('/cartDelete',userAuth,cartController.cartDelete);

//Checkout page
router.get('/checkout',userAuth,checkoutController.getCheckout);
router.get('/addAddressCheckout',userAuth,checkoutController.addAddress);
router.post('/addAddressCheckout',userAuth,checkoutController.postAddAddress);
router.get('/editAddressCheckout',userAuth,checkoutController.editAddress);
router.post('/editAddressCheckout/:id',userAuth,checkoutController.postEditAddress);
router.get('/deleteAddressCheckout',userAuth,checkoutController.deleteAddress);
router.post('/createOrder',userAuth,checkoutController.createOrder);


router.get('/passAddress',userAuth,checkoutController.passAddress);
router.get('/payment',userAuth,checkoutController.getPayment);
router.get('/placeOrder',userAuth,checkoutController.getPlaceOrder);
router.post('/placeOrder',userAuth,checkoutController.placeOrder);
router.get('/orderSuccess',userAuth,checkoutController.getOrderSuccess);


//Order Page
router.get('/orders',userAuth,orderController.getOrderPage);
router.delete('/cancelOrder/:orderId/:productId',userAuth,orderController.cancelOrderItem);


//Whishlist Management
router.get('/addToWishlist',userAuth,wishlistController.addToWishlist);
router.get('/wishlist',userAuth,wishlistController.getWishlist);
router.delete('/wishlistDelete',userAuth,wishlistController.deleteWishlist);








module.exports = router;