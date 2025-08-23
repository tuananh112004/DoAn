const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    // user_id: String,
    cart_id: String,
    userInfo:{
        fullName: String,
        phone: String,
        address: String
    },
    status: { type: String, default: 'pending' },
    products:[{
        product_id: String,
        price: Number,
        discountPercentage: Number,
        quantity: Number,
        title: String,
        thumbnail: String
    }],
    totalAmount: { type: Number, default: 0 },

    },
    {timestamps:true}
    
    );

const Order = mongoose.model("Order",OrderSchema,"orders");

module.exports = Order;