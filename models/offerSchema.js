const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const offerSchema = new Schema({
    offerType: {
        type: String,
        enum: ['Product','Category','Refferal'],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    discountPercentage: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Active','Inactive'],
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: function(){
            return this.offerType === 'Product';
        }
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: function(){
            return this.offerType === 'Category';
        }
    },
    referralCode: {
        type: String,
        required: function() {
            return this.offerType === 'Refferral';
        }
    },
    referralBonus: {
        type: Number,
        required: function(){
            return this.offerType === 'Referral';
        }
    }
},{timestamps: true});

const Offer = mongoose.model('Offer',offerSchema);

module.exports = Offer;