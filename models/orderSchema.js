const mongoose = require('mongoose');
const {Schema} = mongoose;
const {v4:uuidv4} = require('uuid');

const orderSchema = new Schema({
    orderId: {
        type: String,
        default: ()=>uuidv4(),
        unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [{

        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            default:0,
        },
        totalPrice: {
            type: Number,
            default: 0,
        }
    }],
    totalPrice: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
    },
    deliveryCharge: {
        type: Number,
        default: 80,
    },
    finalAmount: {
        type: Number,
        required: true,
    },
    address: {
        type: Schema.Types.ObjectId,
        ref: 'Address',
        required: true,
    },
    invoiceDate: {
        type: Date,
    },
    deliveryDate: {
        type: Date,
        required: true,
    },
    userAddress: [{
        
        address: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,

        },
        landMark: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        pincode: {
            type: Number,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        altPhone: {
            type: String,
            required: true,
        }
    }],
    status: {
        type: String,
        required: true,
        enum: ['Pending','Processing','Shipped','Delivered','Cancelled','Return Request','Approved Return Request','Returned','Order Not Placed','Return Request Rejected'],
    },
    cancellationReason: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
        },
        reason: {
            type: String,
            required: true,
        }
    }],
    returnRequestReason: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
        },
        reason: {
            type: String,
            required: true,
        }
    }],
    returnExpireDate:{
        type: Date,
        required: true,
    },
    couponApplied: {
        type: Boolean,
        default: false,
    },
    couponId: {
        type: Schema.Types.ObjectId,
        ref: 'Coupon'
    }
    ,
    paymentMethod: {
        type: String,
        enum: ['COD','Online'],
        required: true,
        default: 'COD'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending','Paid'],
        default: 'Pending'
    }

},{timestamps: true});


const Order = mongoose.model('Order',orderSchema);

module.exports = Order;