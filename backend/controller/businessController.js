import mongoose from "mongoose";
import Business from "../models/Business.js";
import User from "../models/User.js";
import Order from "../models/Order.js";

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
