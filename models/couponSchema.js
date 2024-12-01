const mongoose = require('mongoose');
const {Schema} = mongoose;


const couponSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    couponCode: {
        type: String,
        required: true,
        unique: true,
    },
    startDate: {
        type: Date,
        required: true
    }
    ,
    expireOn: {
        type: Date,
        required: true,
    },
    offerPrice: {
        type: Number,
        required: true,
    },
    minimumPrice: {
        type: Number,
        required: true,
    },
    usagePerUser: {
        type: Number,
        required: true,
        default: 1
    },
    maxTotalUsers: {
        type: Number,
        required: true,
        default: 20,
    },
    totalUsers: {
        type: Number,
        required: true,
        default: 0,
    },
    isList: {
        type: Boolean,
        default: true,
    },
    userId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }]
},{timestamps: true});


const Coupon = mongoose.model('Coupon',couponSchema);

module.exports = Coupon;