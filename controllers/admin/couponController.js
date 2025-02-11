const Coupon = require('../../models/couponSchema')




const loadCouponPage = async (req,res)=>{
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page-1)*limit;

        const couponData = await Coupon.find({})
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit);

        const totalCoupons = await Coupon.countDocuments();
        const totalPages = Math.ceil(totalCoupons / limit);

        

        res.render('admin-coupon',{
            coupons: couponData,
            currentPage: page,
            totalPages: totalPages,
            totalCoupons: totalCoupons,

        })
       
        
    } catch (error) {

        console.error('Error in load Coupon page: ',error);
        res.redirect('/admin/pageerror');
        
    }
}



const addCoupon = async (req,res)=>{
    try {
        const { name, couponCode, discountPercentage, minOrderValue, maxUsers, startDate, endDate } = req.body;

        
        if (!name || !couponCode || !discountPercentage || !minOrderValue || !maxUsers || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const existingCouponByName = await Coupon.findOne({name});
        const existingCouponByCode = await Coupon.findOne({couponCode});

        if(existingCouponByName && existingCouponByCode){
            return res.status(400).json({success: false, message: 'Coupon with the name and coupon code already exists. Change the name and coupon code.'});
        }

        if(existingCouponByName){
            return res.status(400).json({success: false, message: 'Coupon name already exists. Change the name.' });
        }

        if(existingCouponByCode){
            return res.status(400).json({success: false, message: 'Coupon code already exists. Change the coupon code.' });
        }

        const newCoupon = new Coupon({
            name,
            couponCode,
            offerPrice: discountPercentage,
            minimumPrice: minOrderValue,
            maxTotalUsers: maxUsers,
            startDate: new Date(startDate),
            expireOn: new Date(endDate),
        });

        await newCoupon.save();
        res.status(201).json({ success: true, message: 'Coupon created successfully' });
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}


const getEditCoupon = async(req,res)=>{
    try {

        const id = req.query.id;
        const coupon = await Coupon.findOne({_id:id});


        res.render('edit-coupon',{
            coupon: coupon
        })
        
    } catch (error) {

        console.erro('Error: ',error);
        res.redirect('/admin/pageerror');
        
    }
}

const editCoupon = async (req, res) => {
    const { id } = req.params;
    const {
        name,
        couponCode,
        discountPercentage,
        minimumPrice,
        maxTotalUsers,
        endDate,
    } = req.body;

    try {
        let coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }

        const existingCoupon = await Coupon.findOne({ name, _id: { $ne: id } });

        const existingCouponByCode = await Coupon.findOne({ couponCode, _id: { $ne: id } });

        if(existingCoupon && existingCouponByCode){
            return res.status(400).json({ error: 'Coupon with the name and coupon code already exists. Change the name and coupon code.' });
        }
        if (existingCoupon) {
            return res.status(400).json({ error: 'Coupon name already exists. Change the name.' });
        }
        if(existingCouponByCode){
            return res.status(400).json({ error: 'Coupon code already exists. Change the coupon code.' });
        }

        coupon.name = name;
        coupon.couponCode = couponCode;
        coupon.offerPrice = discountPercentage;
        coupon.minimumPrice = minimumPrice;
        coupon.maxTotalUsers = maxTotalUsers;
        coupon.expireOn = new Date(endDate);

        await coupon.save();

        return res.status(200).json({ success: 'Coupon updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server Error');
    }
};


const deleteCoupon = async (req,res)=>{
    try {

        const id = req.query.id;

        await Coupon.findOneAndDelete({_id:id});

        res.status(200).json({message: 'Coupon deleted successfully'});
        
    } catch (error) {

        console.error('Error in delete coupon: ',error);
        res.redirect('/admin/pageerror');
        
    }
}


const getListCoupon = async (req,res)=>{
    try {
        
        let id = req.query.id;
        await Coupon.updateOne({_id:id},{$set: {isList: false}});
        res.redirect('/admin/coupon');

        
    } catch (error) {

        console.error('Error in getListCoupon: ',error);
        res.redirect('/admin/pageerror');
        
    }
}


const getUnlistCoupon = async (req,res)=>{
    try {
        
        let id = req.query.id;
        await Coupon.updateOne({_id:id},{$set: {isList: true}});
        res.redirect('/admin/coupon');

        
    } catch (error) {

        console.error('Error in getListCoupon: ',error);
        res.redirect('/admin/pageerror');
        
    }
}





module.exports = {
    loadCouponPage,
    addCoupon,
    getEditCoupon,
    editCoupon,
    deleteCoupon,
    getListCoupon,
    getUnlistCoupon,
}