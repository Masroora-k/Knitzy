const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const Coupon = require('../../models/couponSchema');
const Offer = require('../../models/offerSchema');
const { startOfWeek, endOfWeek ,startOfDay, endOfDay} = require('date-fns');
const moment = require('moment-timezone');






const calculateWeeklySalesData = async () => {
    const startDate = startOfWeek(new Date());
    const endDate = endOfWeek(new Date());

    const orders = await Order.find({
        invoiceDate: { $gte: startDate, $lte: endDate },
        status: 'Delivered'
    }).populate({
        path: 'orderItems.product',
        populate: { path: 'productOffer' }
    }).populate('couponId');

    let totalSalesCount = 0;
    let couponDeduction = 0;
    let offerDiscountTotal = 0;
    let netSales = 0;

    const orderDetails = orders.map(order => {
        totalSalesCount++;

        
        const regularPrice = order.orderItems.reduce((acc, item) => acc + item.product.salePrice * item.quantity, 0);

      
        let orderCouponDeduction = 0;
        if (order.couponId) {
            const couponDiscountAmount = (order.totalPrice * order.couponId.offerPrice) / 100;
            orderCouponDeduction = Math.round(couponDiscountAmount);
            couponDeduction += orderCouponDeduction;
        }

        
        let offerDetails = 'N/A';
        const offerProducts = order.orderItems.filter(item => item.product.productOffer);
        if (offerProducts.length > 0) {
            offerDetails = offerProducts.map(item => {
                const offer = item.product.productOffer;
                let discountAmount = (item.product.regularPrice * offer.discountPercentage) / 100;
                discountAmount = Math.round(discountAmount);
                offerDiscountTotal += discountAmount;
                return `${offer.discountPercentage}% on ${item.product.productName}`;
            }).join(', ');
        }

        
        const soldPrice = order.finalAmount;
        netSales += soldPrice;

        
        return {
            orderId: order.orderId,
            products: order.orderItems.map(item => item.product.productName).join(', '),
            totalQuantity: order.orderItems.reduce((acc, item) => acc + item.quantity, 0),
            regularPrice,
            offer: offerDetails,
            coupon: orderCouponDeduction > 0 ? `${orderCouponDeduction}` : 'N/A',
            soldPrice,
        };
    });

    return {
        orderDetails,
        totalSalesCount,
        couponDeduction,
        totalOffer: offerDiscountTotal,
        netSales
    };
};




const calculateDailySalesData = async () => {
   
    const today = new Date();

    console.log('Today: ',today);
   
    const startOfDayDate = startOfDay(today);

    
    const endOfDayDate = endOfDay(today);

    
    const orders = await Order.find({
        invoiceDate: { $gte: startOfDayDate, $lte: endOfDayDate },
        status: 'Delivered'
    }).populate({
        path: 'orderItems.product',
        populate: { path: 'productOffer' }
    }).populate('couponId');

    let totalSalesCount = 0;
    let couponDeduction = 0;
    let offerDiscountTotal = 0;
    let netSales = 0;

    const orderDetails = orders.map(order => {
        totalSalesCount++;

        const regularPrice = order.orderItems.reduce((acc, item) => acc + item.product.salePrice * item.quantity, 0);

        let orderCouponDeduction = 0;
        if (order.couponId) {
            const couponDiscountAmount = (order.totalPrice * order.couponId.offerPrice) / 100;
            orderCouponDeduction = Math.round(couponDiscountAmount);
            couponDeduction += orderCouponDeduction;
        }

        let offerDetails = 'N/A';
        const offerProducts = order.orderItems.filter(item => item.product.productOffer);
        if (offerProducts.length > 0) {
            offerDetails = offerProducts.map(item => {
                const offer = item.product.productOffer;
                let discountAmount = (item.product.regularPrice * offer.discountPercentage) / 100;
                discountAmount = Math.round(discountAmount);
                offerDiscountTotal += discountAmount;
                return `${offer.discountPercentage}% on ${item.product.productName}`;
            }).join(', ');
        }

        const soldPrice = order.finalAmount;
        netSales += soldPrice;

        return {
            orderId: order.orderId,
            products: order.orderItems.map(item => item.product.productName).join(', '),
            totalQuantity: order.orderItems.reduce((acc, item) => acc + item.quantity, 0),
            regularPrice,
            offer: offerDetails,
            coupon: orderCouponDeduction > 0 ? `${orderCouponDeduction}` : 'N/A',
            soldPrice,
        };
    });

    return {
        orderDetails,
        totalSalesCount,
        couponDeduction,
        totalOffer: offerDiscountTotal,
        netSales
    };
};





const calculateSalesData = async (startDate, endDate) => {
    const timeZone = 'UTC'; 

    
    const adjustedStartDate = moment.tz(startDate, timeZone).startOf('day').toDate(); 
    const adjustedEndDate = moment.tz(endDate, timeZone).endOf('day').toDate(); 

    console.log('Adjusted Start Date (UTC):', adjustedStartDate);  
    console.log('Adjusted End Date (UTC):', adjustedEndDate); 

    
    const orders = await Order.find({
        invoiceDate: { $gte: adjustedStartDate, $lte: adjustedEndDate },
        status: 'Delivered'
    }).populate({
        path: 'orderItems.product',
        populate: { path: 'productOffer' }
    }).populate('couponId');

    console.log('Orders: ', orders);  

    let totalSalesCount = 0;
    let couponDeduction = 0;
    let offerDiscountTotal = 0;
    let netSales = 0;

    const orderDetails = orders.map(order => {
        totalSalesCount++;
        console.log('Order Invoice Date: ', order.invoiceDate); 

       
        const regularPrice = order.orderItems.reduce((acc, item) => acc + item.product.salePrice * item.quantity, 0);

        let orderCouponDeduction = 0;
        if (order.couponId) {
            const couponDiscountAmount = (order.totalPrice * order.couponId.offerPrice) / 100;
            orderCouponDeduction = Math.round(couponDiscountAmount);
            couponDeduction += orderCouponDeduction;
        }

        let offerDetails = 'N/A';
        const offerProducts = order.orderItems.filter(item => item.product.productOffer);
        if (offerProducts.length > 0) {
            offerDetails = offerProducts.map(item => {
                const offer = item.product.productOffer;
                let discountAmount = (item.product.regularPrice * offer.discountPercentage) / 100;
                discountAmount = Math.round(discountAmount);
                offerDiscountTotal += discountAmount;
                return `${offer.discountPercentage}% on ${item.product.productName}`;
            }).join(', ');
        }

        const soldPrice = order.finalAmount;
        netSales += soldPrice;

        return {
            orderId: order.orderId,
            products: order.orderItems.map(item => item.product.productName).join(', '),
            totalQuantity: order.orderItems.reduce((acc, item) => acc + item.quantity, 0),
            regularPrice,
            offer: offerDetails,
            coupon: orderCouponDeduction > 0 ? `${orderCouponDeduction}` : 'N/A',
            soldPrice,
        };
    });

   
    return {
        orderDetails,
        totalSalesCount,
        couponDeduction,
        totalOffer: offerDiscountTotal,
        netSales
    };
};


const calculateMonthlySalesData = async (monthSelect) => {
  
    const [year, month] = monthSelect.split('-');

    
    const startOfMonth = moment(`${year}-${month}-01`).startOf('month').toDate();
    const endOfMonth = moment(`${year}-${month}-01`).endOf('month').toDate();

    console.log('Start of Month: ', startOfMonth);
    console.log('End of Month: ', endOfMonth);

   
    const orders = await Order.find({
        invoiceDate: { $gte: startOfMonth, $lte: endOfMonth },
        status: 'Delivered'
    }).populate({
        path: 'orderItems.product',
        populate: { path: 'productOffer' }
    }).populate('couponId');

    let totalSalesCount = 0;
    let couponDeduction = 0;
    let offerDiscountTotal = 0;
    let netSales = 0;

    const orderDetails = orders.map(order => {
        totalSalesCount++;

        const regularPrice = order.orderItems.reduce((acc, item) => acc + item.product.salePrice * item.quantity, 0);

        let orderCouponDeduction = 0;
        if (order.couponId) {
            const couponDiscountAmount = (order.totalPrice * order.couponId.offerPrice) / 100;
            orderCouponDeduction = Math.round(couponDiscountAmount);
            couponDeduction += orderCouponDeduction;
        }

        let offerDetails = 'N/A';
        const offerProducts = order.orderItems.filter(item => item.product.productOffer);
        if (offerProducts.length > 0) {
            offerDetails = offerProducts.map(item => {
                const offer = item.product.productOffer;
                let discountAmount = (item.product.regularPrice * offer.discountPercentage) / 100;
                discountAmount = Math.round(discountAmount);
                offerDiscountTotal += discountAmount;
                return `${offer.discountPercentage}% on ${item.product.productName}`;
            }).join(', ');
        }

        const soldPrice = order.finalAmount;
        netSales += soldPrice;

        return {
            orderId: order.orderId,
            products: order.orderItems.map(item => item.product.productName).join(', '),
            totalQuantity: order.orderItems.reduce((acc, item) => acc + item.quantity, 0),
            regularPrice,
            offer: offerDetails,
            coupon: orderCouponDeduction > 0 ? `${orderCouponDeduction}` : 'N/A',
            soldPrice,
        };
    });

    return {
        orderDetails,
        totalSalesCount,
        couponDeduction,
        totalOffer: offerDiscountTotal,
        netSales
    };
};



const loadSalesReportPage = async (req, res) => {
    try {
        const { reportType, startDate, endDate, monthSelect } = req.query;
        console.log('Report Type:', reportType);
        let salesData;

        const sReportType = reportType;
        if (reportType === 'Custom') {
            if (!startDate || !endDate) {
                return res.render('salesReport', {
                    error: 'Start Date and End Date are required for Custom report.'
                });
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            salesData = await calculateSalesData(start, end);
        } else if (reportType === 'Daily') {
            salesData = await calculateDailySalesData();
        } else if (reportType === 'Monthly' && monthSelect) {
            salesData = await calculateMonthlySalesData(monthSelect);
        } else {
            salesData = await calculateWeeklySalesData();
        }

        const formattedDate = new Date().toLocaleDateString();
        const formattedStartDate = moment(startDate).format('MM/DD/YYYY');
        const formattedEndDate = moment(endDate).format('MM/DD/YYYY');

        res.render('salesReport', {
            orderDetails: salesData.orderDetails,
            totalSalesCount: salesData.totalSalesCount,
            couponDeduction: salesData.couponDeduction,
            totalOffer: salesData.totalOffer,
            netSales: salesData.netSales,
            sReportType: sReportType,
            reportType: reportType === 'Custom'
                ? `Custom: ${formattedStartDate} to ${formattedEndDate}`
                : (reportType === 'Daily' ? `Daily: ${formattedDate}` : (reportType === 'Monthly' ? `Monthly: ${monthSelect}` : `Weekly: ${startOfWeek(new Date()).toLocaleDateString()} to ${endOfWeek(new Date()).toLocaleDateString()}`))
        });
    } catch (error) {
        console.log('Error in loading sales report page: ', error);
        res.redirect('/admin/pageerror');
    }
};





module.exports = {
    loadSalesReportPage,
}