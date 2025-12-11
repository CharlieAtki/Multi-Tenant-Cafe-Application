// Simple in-memory cache for AI insights
const insightsCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Helper to generate cache key
const getCacheKey = (userId, businessId, message) => {
    // Normalize common queries to improve cache hits
    const normalized = message.toLowerCase().trim();
    if (normalized.includes('performance') || normalized.includes('analyze')) {
        return `${userId || businessId}_performance`;
    }
    if (normalized.includes('recommend') || normalized.includes('product')) {
        return `${userId || businessId}_recommendations`;
    }
    if (normalized.includes('competitor') || normalized.includes('compare')) {
        return `${userId || businessId}_competitors`;
    }
    // For other queries, use a hash of the message
    return `${userId || businessId}_${normalized.substring(0, 50)}`;
};

// Check if cached data is still valid
const getCachedInsight = (key) => {
    const cached = insightsCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    // Remove expired cache
    if (cached) {
        insightsCache.delete(key);
    }
    return null;
};

// Store insight in cache
const setCachedInsight = (key, data) => {
    insightsCache.set(key, {
        data,
        timestamp: Date.now()
    });
    
    // Simple cache size management: remove oldest if > 1000 entries
    if (insightsCache.size > 1000) {
        const firstKey = insightsCache.keys().next().value;
        insightsCache.delete(firstKey);
    }
};

export const agentChat = async (req, res) => {
    const { message, history } = req.body; // ⬅️ include history from frontend
    const authHeader = req.headers.authorization;

    // Extract token (remove "Bearer ")
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No authentication token provided'
        });
    }

    const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL;

    try {
        // Generate cache key based on user and query type
        const userId = req.user?.id;
        const businessId = req.user?.business?.businessId;
        const cacheKey = getCacheKey(userId, businessId, message);
        
        // Check cache only for initial queries (no history)
        if (!history || history.length === 0) {
            const cachedResponse = getCachedInsight(cacheKey);
            if (cachedResponse) {
                console.log(`📦 Cache HIT for key: ${cacheKey}`);
                return res.status(200).json({
                    success: true,
                    message: 'Message sent successfully',
                    payload: {
                        response: cachedResponse,
                        cached: true
                    },
                });
            }
            console.log(`🔍 Cache MISS for key: ${cacheKey}`);
        }

        const response = await fetch(`${AGENT_SERVER_URL}/api/agent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token, // Send raw token
            },
            body: JSON.stringify({
                message,
                history,      // ⬅️ forward conversation history
                userData: req.user, // user info for personalization
            }),
        });

        if (!response.ok) {
            throw new Error(`Agent service responded with status ${response.status}`);
        }

        const data = await response.json();

        // Cache the response if it's an initial query (no history)
        if (!history || history.length === 0) {
            setCachedInsight(cacheKey, data.response);
        }

        res.status(200).json({
            success: true,
            message: 'Message sent successfully',
            payload: data,
        });

    } catch (error) {
        console.error('Error calling agent service:', error);
        
        // Fallback: Try to return cached data even if expired
        const userId = req.user?.id;
        const businessId = req.user?.business?.businessId;
        const cacheKey = getCacheKey(userId, businessId, message);
        const cached = insightsCache.get(cacheKey);
        
        if (cached) {
            console.log(`⚠️ Returning expired cache due to error`);
            return res.status(200).json({
                success: true,
                message: 'Using cached response (AI service unavailable)',
                payload: {
                    response: cached.data + '\n\n⚠️ This is cached data. AI service is currently unavailable.',
                    cached: true,
                    expired: true
                },
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error while calling agent service',
            error: error.message,
        });
    }
};
