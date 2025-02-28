const express = require('express');
const router = express.Router();
const passport = require('passport');
const userController =require('../controllers/user/userController');
const profileController = require('../controllers/user/profileController');
const productDetailsController = require('../controllers/user/productDetailsController');
const cartController = require('../controllers/user/cartController');
const checkoutController = require('../controllers/user/checkoutController');
const orderController = require('../controllers/user/orderController');
const shoppingController = require('../controllers/user/shoppingController');
const wishlistController = require('../controllers/user/wishlistController');
const couponController = require('../controllers/user/userCouponController');
const walletController = require('../controllers/user/walletController');

const {userAuth} = require('../middlewares/auth');


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
router.get('/shop',userAuth,shoppingController.loadShoppingPage); 
router.get('/search-filter',userAuth,shoppingController.searchAndFilter);
//filter
router.get('/filter',userAuth,shoppingController.filter);

//Search 
router.get('/search-suggestions',userAuth,shoppingController.searchSuggestions);
router.get('/search',userAuth,shoppingController.searchProduct);


//Cart page
router.get('/addToCart',userAuth,cartController.addToCart);
router.get('/cart',userAuth,(req, res, next) => {
    console.log('get request for load cart');
    next();
},cartController.getCartPage);
router.patch('/cartUpdate',userAuth,cartController.cartUpdate);
router.delete('/cartDelete',userAuth,cartController.cartDelete);
router.get('/cart-validate',userAuth,cartController.cartValidate);

//Checkout page
router.get('/checkout',userAuth,checkoutController.getCheckout);
router.get('/addAddressCheckout',userAuth,checkoutController.addAddress);
router.post('/addAddressCheckout',userAuth,checkoutController.postAddAddress);
router.get('/editAddressCheckout',userAuth,checkoutController.editAddress);
router.post('/editAddressCheckout/:id',userAuth,checkoutController.postEditAddress);
router.get('/deleteAddressCheckout',userAuth,checkoutController.deleteAddress);
router.post('/createOrder',userAuth,checkoutController.createOrder);


router.get('/passAddress',userAuth,checkoutController.passAddress);
router.get('/placeOrder',userAuth,checkoutController.getPlaceOrder);
router.post('/placeOrder',userAuth,checkoutController.placeOrder);
router.get('/orderSuccess',userAuth,checkoutController.getOrderSuccess);
router.post('/createRazorpayOrder',userAuth,(req, res, next) => {
    console.log('post request for razor');
    next();
},checkoutController.createRazorpayOrder);
router.post('/handlePaymentFailure',userAuth,checkoutController.handlePaymentFailure);

//Order Page
router.get('/orders',userAuth,orderController.getOrderPage);
router.post('/cancelOrder/:orderId',userAuth,orderController.cancelOrderItem);
router.post('/returnOrder/:orderId',userAuth,orderController.returnRequest);
router.get('/viewOrderDetails',userAuth,orderController.viewOrderDetails);
router.get('/trackOrder',userAuth,orderController.trackOrder);



//Whishlist Management
router.get('/addToWishlist',userAuth,wishlistController.addToWishlist);
router.get('/wishlist',userAuth,wishlistController.getWishlist);
router.delete('/wishlistDelete',userAuth,wishlistController.deleteWishlist);


//Coupon 
router.get('/coupon',userAuth,couponController.getCouponpage);
router.post('/applyCoupon',userAuth,couponController.applyCoupon);
router.delete('/removeCoupon',userAuth,couponController.removeCoupon);

//Wallet page
router.get('/wallet',userAuth,walletController.getWallet);



//About us
router.get('/about',userController.aboutUs);
                                             

module.exports = router;