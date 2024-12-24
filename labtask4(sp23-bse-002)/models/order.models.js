const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    cart: { type: Object, required: true }, 
    total: { type: Number, required: true },
    status: { type: String, default: "Processing" },
    createdAt: { type: Date, default: Date.now }
    
});

module.exports = mongoose.model('Order', orderSchema);
