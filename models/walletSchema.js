const mongoose = require('mongoose');
const {Schema} = mongoose;


const walletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    } ,
    balance: {
        type: Number,
        default: 0,
    },
    currency:{
        type: String,
        default: 'INR'
    },
    transactions: [
        {
            amount: {
                type: Number,
                required: true,
            },
            type: {
                type: String,
                enum: ['Credit','Debit'],
                required: true,
            },
            description: {
                type: String,
                required: false,
            },
            date: {
                type: Date,
                default: Date.now,
            }
        }
    ]
},{timestamps: true});

const Wallet = mongoose.model('Wallet',walletSchema);
module.exports = Wallet;








