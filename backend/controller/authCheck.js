import jwt from 'jsonwebtoken';

// This API is used to check whether the user has a valid JWT token
export const authCheck = async (req, res) => {
    // Setting headers for Safari
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
    res.setHeader('Content-Type', 'application/json');

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token provided"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        return res.status(200).json({
            success: true,
            message: 'Authentication Successful!',
            user: decoded
        });
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

// Helper function to generate JWT tokens
export const generateTokens = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        business: user.business || null, // Include business data if present
    };

    const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

// Refresh token endpoint
export const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: "Refresh token required"
        });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const tokens = generateTokens(decoded);

        res.json({
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (err) {
        res.status(403).json({
            success: false,
            message: "Invalid refresh token"
        });
    }
};
