const express = require('express');
const router = express.Router();
const path = require('path');
const adminController = require('../controllers/admin/adminController');
const customerController = require('../controllers/admin/customerController');
const categoryController = require('../controllers/admin/categoryController');
const productController = require('../controllers/admin/productController');
const multer = require('multer');
const {userAuth,adminAuth} = require('../middlewares/auth');



const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,path.join(__dirname,'../public/uploads/product-images'));
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+'-'+file.originalname);
    }
})

const uploads = multer({storage: storage});

router.get('/pageerror',adminAuth,adminController.pageerror);
router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/',adminAuth,adminController.loadDashboard);
router.get('/logout',adminController.logout);

//Customer Management
router.get('/users',adminAuth,customerController.customerInfo);
router.get('/blockCustomer',adminAuth,customerController.customerBlocked)
router.get('/unblockCustomer',adminAuth,customerController.customerunBlocked)


//Category Management
router.get('/category',adminAuth,categoryController.categoryInfo);
router.post('/addCategory',adminAuth,categoryController.addCategory);
router.get('/listCategory',adminAuth,categoryController.getListCategory);
router.get('/unlistCategory',adminAuth,categoryController.getUnlistCategory);
router.get('/editCategory',adminAuth,categoryController.getEditCategory);                
router.post('/editCategory/:id',adminAuth,categoryController.editCategory);  
router.delete('/deleteCategory', adminAuth, (req, res, next) => {
    console.log('DELETE request received for /admin/deleteCategory');
    next();
}, categoryController.deleteCategory);         

//Product Management
router.get('/products',adminAuth,  (req, res, next) => {
    console.log('get request for products page');
    next();
}, productController.getProduct);

router.post('/addProducts',adminAuth,uploads.array('images',4),productController.addProducts);
router.get('/blockProduct',adminAuth,productController.blockProduct);
router.get('/unblockProduct',adminAuth,productController.unblockProduct);
router.get('/prodAvailable',adminAuth,productController.prodAvailable);
router.get('/prodOutOfStock',adminAuth,productController.prodOutOfStock);
router.get('/prodDiscontinued',adminAuth,productController.prodDiscontinued);
router.get('/editProduct',adminAuth, (req, res, next) => {
    console.log('get request for edit products page');
    next();
}, productController.getEditProduct);
router.post('/editProduct/:id',adminAuth,uploads.array('images',4),productController.editProduct);
router.post('/deleteImage',adminAuth,productController.deleteSingleImage);

module.exports = router;                             