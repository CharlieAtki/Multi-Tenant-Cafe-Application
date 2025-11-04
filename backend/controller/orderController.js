import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

export const completeUserOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userEmail, paymentMethod, deliveryAddress } = req.body;

        // Find user and populate checkout basket
        const user = await User.findOne({ email: userEmail }).session(session);

        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.checkoutBasket || user.checkoutBasket.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Checkout basket is empty"
            });
        }

        // Get all product IDs from basket
        const productIds = user.checkoutBasket.map(item => item.productId);

        // Fetch all products with business info
        const products = await Product.find({ 
            _id: { $in: productIds } 
        }).session(session);

        // Group items by business
        const ordersByBusiness = {};
        let totalOrderValue = 0;

        for (const basketItem of user.checkoutBasket) {
            const product = products.find(p => 
                p._id.toString() === basketItem.productId.toString()
            );

            if (!product) {
                await session.abortTransaction();
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${basketItem.productName}`
                });
            }

            const businessId = product.business.businessId.toString();
            const itemTotal = product.price * basketItem.quantity;
            totalOrderValue += itemTotal;

            if (!ordersByBusiness[businessId]) {
                ordersByBusiness[businessId] = {
                    businessId: product.business.businessId,
                    products: [],
                    totalValue: 0
                };
            }

            ordersByBusiness[businessId].products.push({
                productId: product._id,
                productName: product.productName,
                quantity: basketItem.quantity,
                productPrice: product.price,
                businessId: product.business.businessId
            });

            ordersByBusiness[businessId].totalValue += itemTotal;
        }

        // Create separate orders for each business
        const createdOrders = [];

        for (const businessId in ordersByBusiness) {
            const businessOrder = ordersByBusiness[businessId];

            const order = new Order({
                userId: user._id,
                businessId: businessOrder.businessId,
                orderedProducts: businessOrder.products,
                totalValue: businessOrder.totalValue,
                status: 'Pending',
                deliveryAddress: deliveryAddress || user.address,
                paymentMethod: paymentMethod || 'Card',
                orderDate: new Date()
            });

            const savedOrder = await order.save({ session });
            createdOrders.push(savedOrder);

            // Add order reference to user
            user.orders.push({ orderId: savedOrder._id });
        }

        // Clear the checkout basket
        user.checkoutBasket = [];
        await user.save({ session });

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: 'Order(s) completed successfully',
            orders: createdOrders,
            totalValue: totalOrderValue,
            orderCount: createdOrders.length
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error completing order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete order',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

// Get user's order history
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.find({ userId })
            .populate('businessId', 'businessName')
            .populate('orderedProducts.productId', 'productName imageUrl')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            orders: orders,
            totalOrders: orders.length
        });

    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
};
