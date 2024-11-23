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
    status: {
        type: String,
        required: true,
        enum: ['Pending','Processing','Shipped','Delivered','Cancelled','Return Request','Returned'],
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
    couponApplied: {
        type: Boolean,
        default: false,
    },
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