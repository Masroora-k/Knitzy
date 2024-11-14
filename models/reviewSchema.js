const mongoose = require('mongoose');
const {Schema} = mongoose;

const reviewSchema = new mongoose.Schema({
    review:{
        type: String,
        required: false
    },
    product_id:{
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rating: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
    },
   createdAt: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
         type: Date,
          default: Date.now
    },
    status: { 
        type: String, enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    }
    
})


const Review = mongoose.model('Review',reviewSchema);


module.exports = Review;