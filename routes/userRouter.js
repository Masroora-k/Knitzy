const express = require('express');
const router = express.Router();
const passport = require('passport');
const userController =require('../controllers/user/userController');
const profileController = require('../controllers/user/profileController');
const productDetailsController = require('../controllers/user/productDetailsController')

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
router.get('/filter',userAuth,userController.filterProduct);
router.get('/filterPrice',userAuth,userController.filterByPrice);








module.exports = router;