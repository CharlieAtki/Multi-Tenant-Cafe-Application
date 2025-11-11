import mongoose from "mongoose";

const businessSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    employees: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    onBoardingRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    location: {
        type: String,
    },
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
    ],
}, {
    timestamps: true,
    collection: 'businesses',
});

const Business = mongoose.model('Business', businessSchema);

export default Business;
