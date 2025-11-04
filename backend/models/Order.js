import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Add business reference for easy aggregation
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    orderedProducts: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            productName: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            productPrice: {
                type: Number,
                required: true,
                min: 0
            },
            // Store business info at product level for mixed-business orders
            businessId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Business'
            }
        }
    ],
    totalValue: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    // Additional useful fields for business analytics
    orderDate: {
        type: Date,
        default: Date.now
    },
    deliveryAddress: {
        type: String
    },
    paymentMethod: {
        type: String,
        enum: ['Card', 'Cash', 'Digital Wallet'],
        default: 'Card'
    }
}, 
    {
        timestamps: true,
        collection: 'orders',
    }
);

// Index for efficient business queries
orderSchema.index({ businessId: 1, createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
