const User = require('../../models/userSchema');
const Order = require('../../models/orderSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { startOfWeek, endOfWeek } = require('date-fns');


const pageerror = async (req,res)=>{
    
    res.render('admin-error');
}


const loadLogin =  (req,res)=>{

    if(req.session.admin){
        return res.redirect('/');
    }
    res.render('admin-login',{message: null});

}


const login = async (req,res)=>{
    try {

        const {email,password} = req.body;
        const admin = await User.findOne({email,isAdmin:true});
        

        if(admin){
            const passwordMatch = await bcrypt.compare(password,admin.password);
             

            if(!passwordMatch){return res.render('admin-login',{message: 'Incorrect Password'});
               
            }else {
                 req.session.admin = true;
                return res.redirect('/admin');
            }
        }else {
            return res.render('admin-login',{message: 'Admin not found'});
        }
        
    } catch (error) {

        console.error('login error',error);
        return res.redirect('/pageerror')
        
        
    }
}


// Function to calculate total sales
const calculateTotalSales = async (startDate, endDate) => {
    const totalSales = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          status: 'Delivered'  
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$finalAmount" }
        }
      }
    ]);
    return totalSales.length ? totalSales[0].totalSales : 0;
  };
  
  // Function to get top 10 best-selling products
  const getBestSellingProducts = async (startDate, endDate) => {
    const products = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          status: 'Delivered'  
        }
      },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          totalQuantity: { $sum: "$orderItems.quantity" }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
          $lookup: {
              from: 'products',
              localField: '_id',
              foreignField: '_id',
              as: 'productDetails'
          }
      },
      { $unwind: "$productDetails" },
      {
          $project: {
              _id: 0,
              productId: "$_id",
              productName: "$productDetails.productName",
              totalQuantity: 1
          }
      }
    ]);
    return products.length ? products : [];
  };
  
  // Function to get top 10 best-selling categories
  const getBestSellingCategories = async (startDate, endDate) => {
    const categories = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          status: 'Delivered'  
        }
      },
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$productDetails.category",
          totalQuantity: { $sum: "$orderItems.quantity" }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
          $lookup: {
              from: 'categories',
              localField: '_id',
              foreignField: '_id',
              as: 'categoryDetails'
          }
      },
      { $unwind: "$categoryDetails" },
      {
          $project: {
              _id: 0,
              categoryId: "$_id",
              categoryName: "$categoryDetails.name",
              totalQuantity: 1
          }
      }
    ]);
    return categories;
  };
  
  
  const loadDashboard = async (req, res) => {
    try {
        const startDate = startOfWeek(new Date());
    const endDate = endOfWeek(new Date());
      
      const totalSales = await calculateTotalSales(startDate, endDate);
      const bestSellingProducts = await getBestSellingProducts(startDate, endDate);
      const bestSellingCategories = await getBestSellingCategories(startDate, endDate);
  
      res.render('dashboard', {
        totalSales,
        bestSellingProducts,
        bestSellingCategories,
        sReportType: 'Weekly', 
       
      });
  
    } catch (error) {
      console.error('Error in loadDashboard: ', error);
      res.redirect('/admin/pageerror');
    }
  };
  
  
  
  
  const dashboardGraphs = async (req, res) => {
    try {
      const { reportType, startDate, endDate, monthSelect } = req.query;
      let start, end;
  
      if (reportType === 'Daily') {
        start = new Date();
        end = new Date();
      } else if (reportType === 'Weekly') {
        start = startOfWeek(new Date());
        
        end = endOfWeek(new Date());;
      } else if (reportType === 'Monthly') {
        const [year, month] = monthSelect.split('-');
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0);
      } else if (reportType === 'Custom') {
        start = new Date(startDate);
        end = new Date(endDate);
      }else if (reportType === 'Yearly') {
        // Get the current year
        const currentYear = new Date().getFullYear();
        start = new Date(currentYear, 0, 1); // January 1st of the current year
        end = new Date(currentYear, 11, 31); // December 31st of the current year
      } 
  
      const totalSales = await calculateTotalSales(start, end);
      const bestSellingProducts = await getBestSellingProducts(start, end);
      const bestSellingCategories = await getBestSellingCategories(start, end);

      console.log('products: ',bestSellingProducts);
      console.log('cat: ',bestSellingCategories);
  
      // Return the data in JSON format
      res.json({
        totalSales,
        bestSellingProducts,
        bestSellingCategories
      });
    } catch (error) {
      console.log('Unexpected error in dashboardGraphs', error);
      res.redirect('/pageerror');
    }
  };
  



const logout = async (req,res)=>{
    try {  

        req.session.destroy(err =>{
            if(err){
                console.log('Error destroying session',err);
                return res.redirect('/pageerror');
            }
            res.redirect('/admin/login');
        })
        
    } catch (error) {

        console.log('Unexpected error during logout',error);
        res.redirect('/pageerror')
        
    }
}




module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageerror,
    logout,
    dashboardGraphs,

}     