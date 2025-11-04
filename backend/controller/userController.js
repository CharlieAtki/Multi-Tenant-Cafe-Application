import mongoose from "mongoose";
import {generateTokens} from "./authCheck.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import bcrypt from 'bcryptjs';

// Number of times the hashing algorithm is applied
const saltRounds = 10;

// In your login handler
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find a user by email
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                field: 'email'
            });
        }

        // 2. Verify password
        const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                field: 'password'
            });
        }

        // 3. Generate JWT tokens (THIS IS WHERE JWT IS CREATED)
        const tokens = generateTokens(user);

        // 4. Return tokens and user data
        res.json({
            success: true,
            message: 'Login successful',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user._id,
                email: user.email,
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

export const userCreation = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
                field: 'general'
            });
        }
    
        // Checking if the user already exists
        const existingEmailCheck = await User.findOne({email: email});
        if (existingEmailCheck) {
            return res.status(400).send({
                success: false,
                message: "Email already exists",
                field: "email"
            });
        }

        const passwordString = String(password);
        const hashedPassword = await bcrypt.hash(passwordString, saltRounds);

        // Creating the user account (the object in the MongoDb database)
        const user = new User({
            email: email,
            hashedPassword: hashedPassword
        });
        
        // Save use to the database
        const savedUser = await user.save();
        
        // Generate JWS token immediately after creation
        const tokens = generateTokens(savedUser);

        // 7. Return success response with tokens (auto-login)
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: savedUser._id,
                email: savedUser.email,
            }
        });


    } catch (error) {
        return res.status(400).send({
            success: false,
            message: error.message
        });
    }
};

export const fetchCurrentUserInformation = async (req, res) => {
    try {
        // The JWT middleware already decoded the token and put user info in req.user
        const userId = req.user.id; // or req.user._id depending on what you stored in the JWT

        const currentUser = await User.findById(userId).select('-hashedPassword'); // Exclude password from the response

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: currentUser._id,
                email: currentUser.email,
                business: currentUser.business,
                orders: currentUser.orders,
                userRole: currentUser.business.userRole,
                businessId: currentUser.business.businessId,
                checkoutBasket: currentUser.checkoutBasket,
                createdAt: currentUser.createdAt
            }
        });

    } catch (error) {
        console.error('Fetch user error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error fetching user information'
        });
    }
};

// Update your userLogout function to use the JWT user info
export const userLogout = async (req, res) => {
    try {
        // Get user info from JWT (provided by middleware)
        const userId = req.user?.id;

        // Optional: Log the logout event with user info
        console.log(`User ${userId} logged out at ${new Date().toISOString()}`);

        // If you're using token blacklisting (advanced):
        // const token = req.headers.authorization?.split(' ')[1];
        // await blacklistToken(token);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};

export const addItemToCheckout = async (req, res) => {
    try {
        const { productId, productName, userEmail, quantity } = req.body;

        // Validate that productId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: `Invalid product ID format. Expected MongoDB ObjectId, received: ${productId}`
            });
        }

        // Find the user by email
        const user = await User.findOne({ email: userEmail });

        // Check if user exists in the database
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Cannot find user by email in the database"
            });
        }

        // Ensure checkoutBasket is an array
        if (!Array.isArray(user.checkoutBasket)) {
            user.checkoutBasket = [];
        }

        // Check if item already exists in basket
        const existingItemIndex = user.checkoutBasket.findIndex(
            item => item.productId.toString() === productId.toString()
        );

        if (existingItemIndex !== -1) {
            // If item exists, increment quantity
            user.checkoutBasket[existingItemIndex].quantity += quantity || 1;
        } else {
            // If item doesn't exist, add new item
            user.checkoutBasket.push({
                productId: new mongoose.Types.ObjectId(productId), // Explicitly convert to ObjectId
                productName: productName || "Unknown Product",
                quantity: quantity || 1
            });
        }

        // Save the updated user
        await user.save();

        // Return success message with updated basket
        res.status(200).json({
            success: true,
            message: "Updated the checkout basket with the new item",
            checkoutBasket: user.checkoutBasket
        });

    } catch (error) {
        console.error('Failed to add item to checkout:', error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to add item to checkout"
        });
    }
};

export const updateCheckoutQuantity = async (req, res) => {
    try {
        const { productId, quantity, userEmail } = req.body;

        // Find the user by email
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Cannot find user by email in the database"
            });
        }

        // Find the item in the checkout basket
        const itemIndex = user.checkoutBasket.findIndex(
            item => item.productId.toString() === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Item not found in checkout basket"
            });
        }

        // Update the quantity
        user.checkoutBasket[itemIndex].quantity = quantity;

        // Save the updated user
        await user.save();

        // Return success message with updated basket
        res.status(200).json({
            success: true,
            message: "Updated item quantity",
            checkoutBasket: user.checkoutBasket
        });

    } catch (error) {
        console.error('Failed to update quantity:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const removeFromCheckout = async (req, res) => {
    try {
        const { productId, userEmail } = req.body;

        // Find the user by email
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Cannot find user by email in the database"
            });
        }

        // Remove the item from the checkout basket
        user.checkoutBasket = user.checkoutBasket.filter(
            item => item.productId.toString() !== productId
        );

        // Save the updated user
        await user.save();

        // Return success message with updated basket
        res.status(200).json({
            success: true,
            message: "Item removed from checkout basket",
            checkoutBasket: user.checkoutBasket
        });

    } catch (error) {
        console.error('Failed to remove item:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const calculateTotalCheckoutValue = async (req, res) => {
    try {
        const { userCheckoutBasket, userEmail } = req.body;

        const user = await User.findOne({ email: userEmail });

        // Check if user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Cannot find user by email in the database"
            });
        }

        // Use the basket from the request body, or fall back to the user's saved basket
        const basket = userCheckoutBasket || user.checkoutBasket;

        if (!Array.isArray(basket) || basket.length === 0) {
            return res.status(200).json({
                success: true,
                total: 0,
                message: "Basket is empty"
            });
        }

        // Get all product IDs
        const productIds = basket.map(item => item.productId);

        // Query all matching products from the DB
        const products = await Product.find({ _id: { $in: productIds } });

        // Calculate total
        let total = 0;
        for (const item of basket) {
            const product = products.find(p => p._id.toString() === item.productId);
            const price = product?.price || 0;
            const quantity = item?.quantity || 0;

            total += price * quantity;
        }

        // Return total value
        res.status(200).json({
            success: true,
            total: total
        });

    } catch (error) {
        console.error("Failed to calculate total checkout value:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const fetchCurrentUserCheckout = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the user by ID
        const user = await User.findById(userId);

        // Checking the user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Return the user's checkout basket
        res.status(200).json({
            success: true,
            checkoutBasket: user.checkoutBasket
        });

    } catch (error) {
        console.error("Failed to fetch user checkout:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
