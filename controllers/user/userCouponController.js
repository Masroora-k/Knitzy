const Coupon = require('../../models/couponSchema');
const Cart = require('../../models/cartSchema');


const getCouponpage = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        if(!userId){
         return res.redirect('/login');
        }

        const currentDate = new Date();
        const totalAmount = req.session.totalAmount;

        let coupons = await Coupon.find({
            $and: [
                { userId: { $ne: userId } },
                { startDate: {$lte: currentDate}},
                { expireOn: { $gte: currentDate } },
                { minimumPrice: { $lte: totalAmount } },
                { isList: true }
            ]
        })

        coupons = coupons.filter(coupon => coupon.totalUsers < coupon.maxTotalUsers);

        console.log('Coupons: ',coupons);

        res.render('coupon',{
            user: userId,
            cartQuantity: req.session.cartQuantity,
            coupon: coupons
        });
        
    } catch (error) {

        console.log('Error in get coupon page: ',error);
        res.redirect('/pageNotFound')
        
    }
}



const applyCoupon = async (req,res)=>{

    const { couponCode,userId } = req.body;

    console.log('Req body: ',req.body);


  try {
    const coupon = await Coupon.findOne({  couponCode: couponCode });
    console.log('Coupon code: ',coupon);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

   
    const now = new Date();
    if ( now > coupon.endDate) {
      return res.status(400).json({ message: 'Coupon is not valid' });
    }

  
    const cart = await Cart.findOne({ userId: userId }).populate('items.productId');

    console.log('Cart: ',cart);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }


    const discount = coupon.offerPrice;

    

    const totalAmount = cart.items.reduce((acc,item)=> acc + (item.quantity * item.price),0);
    let newTotalAmount = totalAmount - (totalAmount * (discount / 100));
    newTotalAmount = Math.round(newTotalAmount);

    req.session.couponCode = couponCode;
    req.session.totalAmount = newTotalAmount + 80;
    req.session.discount = discount;
    res.status(200).json({
        message: 'Coupon applied successfully',
        discount: req.session.discount,
        totalAmount: req.session.totalAmount,
        couponCode: req.session.couponCode,
    })

    
   
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }

}


const removeCoupon = async (req,res)=>{
    const { couponCode, userId } = req.body;

    try {
        // Find the cart for the user
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Calculate the total amount without the discount
        const totalAmount = cart.items.reduce((acc, item) => acc + (item.quantity * item.productId.salePrice), 0);

        // Clear the session variables
        req.session.couponCode = null;
        req.session.totalAmount = totalAmount - 80;
        req.session.discount = null;

        res.status(200).json({
            message: 'Coupon removed successfully',
            totalAmount: totalAmount,
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}




module.exports = {
    getCouponpage,
    applyCoupon,
    removeCoupon
}