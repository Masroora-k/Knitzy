const express = require('express');
const router = express.Router();
const passport = require('passport');
const userController =require('../controllers/user/userController');
const profileController = require('../controllers/user/profileController');
const productDetailsController = require('../controllers/user/productDetailsController')



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


router.get('/productDetails',productDetailsController.getProductInfo);


module.exports = router;