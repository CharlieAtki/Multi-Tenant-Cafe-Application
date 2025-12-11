import mongoose from "mongoose";
import Business from "../models/Business.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

export const createBusiness = async (req, res) => {
    try {
        const { businessName, owner } = req.body;

        if (!businessName || !owner) {
            return res.status(400).json({
                success: false,
                message: 'Business name and owner are required',
            });
        }

        // Check if a business with the same name already exists
        const existingBusinessCheck = await Business.findOne({ businessName: businessName });
        if (existingBusinessCheck) {
            return res.status(409).json({
                success: false,
                message: 'Business name already taken',
            });
        }

        // Create new business
        const business = new Business({
            businessName: businessName,
            owner: owner,
            employees: [owner], // Add owner to members array
        });

        await business.save();


        // Update the user's business info
        const user = await User.findById(owner);
        user.business = {
            businessId: business._id,
            businessName: business.businessName,
            userRole: 'owner'
        };
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Business created successfully',
            business: business
        });

    } catch (error) {
        console.error('Business creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};


// Helper function to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
    }).format(amount);
};

// Get business dashboard analytics
export const getBusinessAnalytics = async (req, res) => {
    try {
        const { businessId } = req.body;

        if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
            return res.status(400).json({
                success: false,
                message: "Valid business ID required"
            });
        }

        // 1. Total Sales and Order Count
        const salesAggregate = await Order.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalValue" },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: "$totalValue" }
                }
            }
        ]);

        // 2. Sales by Time Period (Last 7 weeks)
        const sevenWeeksAgo = new Date();
        sevenWeeksAgo.setDate(sevenWeeksAgo.getDate() - 49);

        const salesByWeek = await Order.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    createdAt: { $gte: sevenWeeksAgo },
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        week: { $week: "$createdAt" }
                    },
                    totalSales: { $sum: "$totalValue" },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.week": 1 }
            },
            {
                $project: {
                    _id: 0,
                    week: "$_id.week",
                    year: "$_id.year",
                    name: {
                        $concat: [
                            "Week ",
                            { $toString: "$_id.week" }
                        ]
                    },
                    "Total Sales": "$totalSales",
                    "Number of Orders": "$orderCount"
                }
            }
        ]);

        // 3. Top Selling Products
        const topProducts = await Order.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    status: { $ne: 'Cancelled' }
                }
            },
            { $unwind: "$orderedProducts" },
            {
                $group: {
                    _id: "$orderedProducts.productId",
                    productName: { $first: "$orderedProducts.productName" },
                    totalQuantity: { $sum: "$orderedProducts.quantity" },
                    totalRevenue: {
                        $sum: {
                            $multiply: [
                                "$orderedProducts.quantity",
                                "$orderedProducts.productPrice"
                            ]
                        }
                    }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 }
        ]);

        // 4. Orders by Status
        const ordersByStatus = await Order.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId)
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // 5. Recent Orders (Last 10)
        const recentOrders = await Order.find({
            businessId: businessId
        })
            .populate('userId', 'email')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // 6. Revenue by Day of Week
        const revenueByDayOfWeek = await Order.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" },
                    totalRevenue: { $sum: "$totalValue" },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 }
            },
            {
                $project: {
                    _id: 0,
                    dayOfWeek: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id", 1] }, then: "Sunday" },
                                { case: { $eq: ["$_id", 2] }, then: "Monday" },
                                { case: { $eq: ["$_id", 3] }, then: "Tuesday" },
                                { case: { $eq: ["$_id", 4] }, then: "Wednesday" },
                                { case: { $eq: ["$_id", 5] }, then: "Thursday" },
                                { case: { $eq: ["$_id", 6] }, then: "Friday" },
                                { case: { $eq: ["$_id", 7] }, then: "Saturday" }
                            ],
                            default: "Unknown"
                        }
                    },
                    name: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id", 1] }, then: "Sunday" },
                                { case: { $eq: ["$_id", 2] }, then: "Monday" },
                                { case: { $eq: ["$_id", 3] }, then: "Tuesday" },
                                { case: { $eq: ["$_id", 4] }, then: "Wednesday" },
                                { case: { $eq: ["$_id", 5] }, then: "Thursday" },
                                { case: { $eq: ["$_id", 6] }, then: "Friday" },
                                { case: { $eq: ["$_id", 7] }, then: "Saturday" }
                            ],
                            default: "Unknown"
                        }
                    },
                    "Total Sales": "$totalRevenue",
                    "Number of Orders": "$orderCount"
                }
            }
        ]);

        res.status(200).json({
            success: true,
            analytics: {
                overview: salesAggregate[0] || {
                    totalRevenue: 0,
                    totalOrders: 0,
                    averageOrderValue: 0
                },
                salesByWeek: salesByWeek,
                topProducts: topProducts,
                ordersByStatus: ordersByStatus,
                recentOrders: recentOrders,
                revenueByDayOfWeek: revenueByDayOfWeek
            }
        });

    } catch (error) {
        console.error('Error fetching business analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
            error: error.message
        });
    }
};

export const getTimeRangeAnalytics = async (req, res) => {
  try {
    const { businessId, startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch orders in the range
    const orders = await Order.find({
      businessId,
      createdAt: { $gte: start, $lte: end },
      status: { $ne: "Cancelled" }
    })
      .populate("userId", "email")
      .sort({ createdAt: -1 })
      .lean();

    // Daily aggregates (optional, for charts)
    const analytics = await Order.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          createdAt: { $gte: start, $lte: end },
          status: { $ne: "Cancelled" }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          totalSales: { $sum: "$totalValue" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    res.status(200).json({
      success: true,
      analyticsData: {
        orders,
        analytics
      }
    });
  } catch (error) {
    console.error("Error fetching time range analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message
    });
  }
};

export const fetchCurrentBusinessInfo = async (req, res) => {
    try {
        const { businessId } = req.body;

        if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
            return res.status(400).json({
                success: false,
                message: "Valid business ID required"
            });
        }

        // Fetching business data with populated owner and employees
        const business = await Business.findById(businessId)
            .populate('owner', 'email')       // owner will have only email
            .populate('employees', 'email')  // employees will have only email
            .populate('onBoardingRequests', 'email'); // onboarding requests will have only email

        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }

        return res.status(200).json({
            success: true,
            businessData: business
        });

    } catch (error) {
        console.error("Error in fetchCurrentBusinessInfo:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const joinBusiness = async (req, res) => {
    try {
        const { businessName, userEmail } = req.body;

        if (!businessName || !userEmail) {
            return res.status(400).json({
                success: false,
                message: "Business name and user email are required"
            });
        }

        // Find business by name
        const business = await Business.findOne({ businessName: businessName });
        
        // Check if business exists
        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }

        const user = await User.findOne({ email: userEmail });
        
        // Check if user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if user is already an employee or has a pending onboarding request
        if (business.employees.includes(user._id) || business.onBoardingRequests.includes(user._id)) {
            return res.status(400).json({
                success: false,
                message: "User is already an employee of this business or has a pending onboarding request"
            });
        }

        // Add user to business onboarding requests
        business.onBoardingRequests.push(user._id);

        await business.save(); // Save the updated business document

        return res.status(200).json({
            success: true,
            message: "User added to business successfully"
        });

    } catch (error) {
        console.error("Error in joinBusiness:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const acceptOnboardingRequest = async (req, res) => {
    try {
        const { businessId, userEmail } = req.body; // Safely deconstruct userEmail
        
        // Checks fields exist
        if (!businessId || !userEmail) {
            return res.status(400).json({
                success: false,
                message: "Business ID and user email are required"
            });
        }

        // Fetching business data
        const business = await Business.findById(businessId);

        // Check if business exists
        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }

        // Find user by email
        const user = await User.findOne({ email: userEmail });

        // Check if user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Add user to employees if not already present
        user.business = {
            businessId: business._id,
            businessName: business.businessName,
            userRole: 'employee'
        };

        // Remove user from onboarding requests if present
        // Iterates through onBoardingRequests and filters out the user, which is then reassigned to the onBoardingRequests array
        business.onBoardingRequests = business.onBoardingRequests.filter(
            (userId) => !userId.equals(user._id)
        );

        // Add user to employees array if not already an employee
        if (!business.employees.includes(user._id)) {
            business.employees.push(user._id);
        }

        // Save both documents
        await user.save();
        await business.save();

        return res.status(200).json({
            success: true,
            message: "Onboarding request accepted successfully"
        });

    } catch (error) {
        console.error("Error in acceptOnboardingRequest:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const rejectOnboardingRequest = async (req, res) => {
    try {
        const { businessId, userEmail } = req.body; // Safely deconstructing the request body

        // Checks fields exist
        if (!businessId || !userEmail) {
            return res.status(400).json({
                success: false,
                message: "Business ID and user email are required"
            });
        }

        const business = await Business.findById(businessId); // Fetching business data

        // Check if business exists
        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }

        const user = await User.findOne({ email: userEmail }); // Finding user by email

        // Check if user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Remove user from onboarding requests if present
        // Iterates through onBoardingRequests and filters out the user, which is then reassigned to the onBoardingRequests array
        business.onBoardingRequests = business.onBoardingRequests.filter(
            (userId) => !userId.equals(user._id)
        );

        // Save the updated business document
        await business.save();

        return res.status(200).json({
            success: true,
            message: "Onboarding request rejected successfully"
        });

    } catch (error) {
        console.error("Error in rejectOnboardingRequest:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const removeEmployeeFromBusiness = async (req, res) => {
    try {
        const { businessId, userEmail } = req.body; // Safely deconstructing the request body

        // Checks fields exist
        if (!businessId || !userEmail) {
            return res.status(400).json({
                success: false,
                message: "Business ID and user email are required"
            });
        }

        const business = await Business.findById(businessId); // Fetching business data

        // Check if business exists
        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }

        const user = await User.findOne({ email: userEmail }); // Finding user by email

        // Check if user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Remove user from employees array if present
        business.employees = business.employees.filter(
            (userId) => !userId.equals(user._id)
        );

        // Clear user's business info
        user.business = undefined;

        // Save both documents
        await user.save();
        await business.save();

        return res.status(200).json({
            success: true,
            message: "User removed from business successfully"
        });

    } catch (error) {
        console.error("Error removing employee fromn the business:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get business products (filtered by businessId)
export const getBusinessProducts = async (req, res) => {
    try {
        const { businessId } = req.body;

        if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
            return res.status(400).json({
                success: false,
                message: "Valid business ID required"
            });
        }

        // Import Product model
        const Product = (await import('../models/Product.js')).default;

        // Find all products for this business
        const products = await Product.find({
            'business.businessId': businessId
        }).lean();

        if (!products || products.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No products found for this business",
                payload: {
                    summary: "ℹ️ No products found for this business. Consider adding products to start selling!",
                    product_count: 0,
                    products: []
                }
            });
        }

        // Group by category
        const byCategory = {};
        products.forEach(p => {
            const cat = (p.category || 'other').charAt(0).toUpperCase() + (p.category || 'other').slice(1);
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(p);
        });

        // Build formatted summary
        let summary = `📦 Your Product Catalog (${products.length} items):\n\n`;
        const emojiMap = { Drink: "☕", Food: "🥐", Dessert: "🍰" };

        for (const [category, items] of Object.entries(byCategory)) {
            const emoji = emojiMap[category] || "🛍️";
            summary += `${emoji} ${category}:\n`;
            items.forEach(p => {
                summary += `  • ${p.productName} - £${p.price.toFixed(2)}\n`;
                if (p.description) {
                    summary += `    ${p.description}\n`;
                }
            });
            summary += "\n";
        }

        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            payload: {
                success: true,
                product_count: products.length,
                summary: summary.trim(),
                products
            }
        });

    } catch (error) {
        console.error("Error fetching business products:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get competitor insights (anonymized, aggregated data)
export const getCompetitorInsights = async (req, res) => {
    try {
        const { businessId } = req.body;

        if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
            return res.status(400).json({
                success: false,
                message: "Valid business ID required"
            });
        }

        // Get all products
        const allProducts = await Product.find({}).lean();

        // Find this business's products to determine categories
        // Convert businessId to string for reliable comparison
        const businessIdStr = businessId.toString();
        
        const businessProducts = allProducts.filter(p => {
            if (!p.business?.businessId) return false;
            return p.business.businessId.toString() === businessIdStr;
        });

        if (businessProducts.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Add products first to get insights",
                payload: {
                    summary: "ℹ️ Add products first to get competitor insights based on your categories."
                }
            });
        }

        // Get business categories
        const businessCategories = new Set(
            businessProducts.map(p => (p.category || '').toLowerCase()).filter(c => c)
        );

        // Find competitor products in same categories (exclude own business)
        const competitorProducts = allProducts.filter(
            p => businessCategories.has((p.category || '').toLowerCase()) &&
                 p.business?.businessId?.toString() !== businessIdStr
        );

        if (competitorProducts.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No competitors found",
                payload: {
                    summary: `ℹ️ No other businesses found in your categories: ${Array.from(businessCategories).join(', ')}`
                }
            });
        }

        // Aggregate anonymized insights by category
        const categoryStats = {};

        businessCategories.forEach(cat => {
            const catProducts = competitorProducts.filter(
                p => (p.category || '').toLowerCase() === cat
            );

            if (catProducts.length > 0) {
                const avgPrice = catProducts.reduce((sum, p) => sum + (p.price || 0), 0) / catProducts.length;

                // Count product name frequency
                const productNames = {};
                catProducts.forEach(p => {
                    const name = p.productName || 'Unknown';
                    productNames[name] = (productNames[name] || 0) + 1;
                });

                const topProducts = Object.entries(productNames)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name]) => name);

                // Count unique businesses
                const uniqueBusinesses = new Set(
                    catProducts.map(p => p.business?.businessId).filter(id => id)
                );

                categoryStats[cat] = {
                    business_count: uniqueBusinesses.size,
                    product_count: catProducts.length,
                    avg_price: avgPrice,
                    popular_products: topProducts
                };
            }
        });

        // Format summary - CONCISE KEY METRICS
        const lines = ["🔍 Competitor Insights (Anonymized):"];
        const emojiMap = { drink: "☕", food: "🥐", dessert: "🍰" };

        Object.entries(categoryStats).forEach(([cat, stats]) => {
            const emoji = emojiMap[cat] || "📦";
            const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
            lines.push(`${emoji} ${catName}: ${stats.business_count} businesses, avg £${stats.avg_price.toFixed(2)}`);
            
            // Top 3 popular products only
            stats.popular_products.slice(0, 3).forEach(prod => {
                lines.push(`  • ${prod}`);
            });
        });

        const summary = lines.join("\n");

        res.status(200).json({
            success: true,
            message: "Competitor insights fetched successfully",
            payload: {
                success: true,
                categories_analyzed: Array.from(businessCategories),
                summary,
                stats: categoryStats
            }
        });

    } catch (error) {
        console.error("Error fetching competitor insights:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get product recommendations based on competitor analysis
export const getProductRecommendations = async (req, res) => {
    try {
        const { businessId } = req.body;

        if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
            return res.status(400).json({
                success: false,
                message: "Valid business ID required"
            });
        }

        const Product = (await import('../models/Product.js')).default;

        // Get all products
        const allProducts = await Product.find({}).lean();

        // Convert businessId to string for reliable comparison
        const businessIdStr = businessId.toString();

        // Get business products
        const businessProducts = allProducts.filter(
            p => p.business?.businessId?.toString() === businessIdStr
        );

        if (businessProducts.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Add products first",
                payload: {
                    summary: "ℹ️ Add some products first to get personalized recommendations."
                }
            });
        }

        // Current product names (lowercase for comparison)
        const currentProductNames = new Set(
            businessProducts.map(p => (p.productName || '').toLowerCase())
        );

        // Get business categories
        const businessCategories = new Set(
            businessProducts.map(p => (p.category || '').toLowerCase()).filter(c => c)
        );

        // Find competitor products in same categories
        const competitorProducts = allProducts.filter(
            p => businessCategories.has((p.category || '').toLowerCase()) &&
                 p.business?.businessId?.toString() !== businessIdStr
        );

        if (competitorProducts.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No recommendations available",
                payload: {
                    summary: "✅ Your catalog is comprehensive! You offer the most popular items in your categories."
                }
            });
        }

        // Group by category and count product frequency
        const recommendations = [];

        businessCategories.forEach(cat => {
            const catProducts = competitorProducts.filter(
                p => (p.category || '').toLowerCase() === cat
            );

            if (catProducts.length > 0) {
                // Count product names
                const productCounts = {};
                catProducts.forEach(p => {
                    const name = p.productName || 'Unknown';
                    productCounts[name] = (productCounts[name] || 0) + 1;
                });

                // Get popular products not in current catalog
                const popularProducts = Object.entries(productCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name]) => name)
                    .filter(name => !currentProductNames.has(name.toLowerCase()))
                    .slice(0, 3);

                if (popularProducts.length > 0) {
                    // Calculate avg price for category
                    const avgPrice = catProducts.reduce((sum, p) => sum + (p.price || 0), 0) / catProducts.length;

                    recommendations.push({
                        category: cat,
                        products: popularProducts,
                        avg_price: avgPrice
                    });
                }
            }
        });

        if (recommendations.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Catalog is comprehensive",
                payload: {
                    summary: "✅ Your catalog is comprehensive! You offer the most popular items in your categories.",
                    recommendation_count: 0,
                    recommendations: []
                }
            });
        }

        // Format summary - CONCISE BULLET POINTS
        const lines = ["💡 Recommended Products:"];
        const emojiMap = { drink: "☕", food: "🥐", dessert: "🍰" };

        recommendations.forEach(rec => {
            const emoji = emojiMap[rec.category] || "📦";
            rec.products.forEach(product => {
                lines.push(`${emoji} ${product} (~£${rec.avg_price.toFixed(2)})`);
            });
        });

        const summary = lines.join("\n");
        const totalCount = recommendations.reduce((sum, r) => sum + r.products.length, 0);

        res.status(200).json({
            success: true,
            message: "Recommendations generated successfully",
            payload: {
                success: true,
                recommendation_count: totalCount,
                summary,
                recommendations
            }
        });

    } catch (error) {
        console.error("Error generating product recommendations:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get performance insights with recommendations
export const getPerformanceInsights = async (req, res) => {
    try {
        const { businessId } = req.body;

        if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
            return res.status(400).json({
                success: false,
                message: "Valid business ID required"
            });
        }

        // Get analytics data (reuse existing aggregation)
        const salesAggregate = await Order.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalValue" },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: "$totalValue" }
                }
            }
        ]);

        const overview = salesAggregate[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };

        // Sales by week (last 7 weeks)
        const sevenWeeksAgo = new Date();
        sevenWeeksAgo.setDate(sevenWeeksAgo.getDate() - 49);

        const salesByWeek = await Order.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    createdAt: { $gte: sevenWeeksAgo },
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        week: { $week: "$createdAt" }
                    },
                    totalSales: { $sum: "$totalValue" }
                }
            },
            { $sort: { "_id.year": 1, "_id.week": 1 } }
        ]);

        // Revenue by day of week
        const revenueByDay = await Order.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    status: { $ne: 'Cancelled' }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" },
                    totalSales: { $sum: "$totalValue" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Map day numbers to names
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        revenueByDay.forEach(day => {
            day._id = dayNames[day._id - 1];
        });

        // Top products
        const topProducts = await Order.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    status: { $ne: 'Cancelled' }
                }
            },
            { $unwind: "$orderedProducts" },
            {
                $group: {
                    _id: "$orderedProducts.productId",
                    productName: { $first: "$orderedProducts.productName" },
                    totalQuantity: { $sum: "$orderedProducts.quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);

        // Build concise key insights
        const insights = [];

        // Week-over-week trend
        if (salesByWeek.length >= 2) {
            const lastWeek = salesByWeek[salesByWeek.length - 1].totalSales;
            const prevWeek = salesByWeek[salesByWeek.length - 2].totalSales;

            if (prevWeek > 0) {
                const growth = ((lastWeek - prevWeek) / prevWeek) * 100;
                const emoji = growth > 0 ? "📈" : "📉";
                insights.push(`${emoji} Week-over-week: ${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`);
            }
        }

        // Best/worst days
        if (revenueByDay.length > 1) {
            const sortedDays = [...revenueByDay].sort((a, b) => b.totalSales - a.totalSales);
            const bestDay = sortedDays[0];
            const worstDay = sortedDays[sortedDays.length - 1];

            insights.push(`⭐ Best: ${bestDay._id} (£${bestDay.totalSales.toFixed(2)})`);
            insights.push(`⚠️ Weakest: ${worstDay._id} (£${worstDay.totalSales.toFixed(2)})`);
        }

        // Top product
        if (topProducts.length > 0) {
            const top = topProducts[0];
            insights.push(`🏆 Top: ${top.productName} (${top.totalQuantity} sold)`);
        }

        // Key recommendations (max 2)
        const recs = [];
        if (overview.averageOrderValue < 10 && overview.totalOrders > 0) {
            recs.push("💡 Boost avg order: Bundle products or create combos");
        }
        if (overview.totalOrders > 0 && overview.totalOrders < 50) {
            recs.push("💡 Increase visibility: Focus on marketing campaigns");
        } else if (overview.totalOrders > 100) {
            recs.push("💡 Scale up: Consider expanding product range");
        }

        if (revenueByDay.length > 1) {
            const sortedDays = [...revenueByDay].sort((a, b) => b.totalSales - a.totalSales);
            const worst = sortedDays[sortedDays.length - 1];
            if (worst.totalSales < sortedDays[0].totalSales * 0.5) {
                recs.push(`💡 Run promotions on ${worst._id} to boost slower days`);
            }
        }

        insights.push(...recs.slice(0, 2)); // Limit to 2 recommendations

        const summary = insights.join("\n");

        res.status(200).json({
            success: true,
            message: "Performance insights generated successfully",
            payload: {
                success: true,
                summary,
                metrics: {
                    total_revenue: overview.totalRevenue,
                    total_orders: overview.totalOrders,
                    avg_order_value: overview.averageOrderValue
                }
            }
        });

    } catch (error) {
        console.error("Error analyzing performance:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
