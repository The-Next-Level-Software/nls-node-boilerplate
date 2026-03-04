import rateLimit from "express-rate-limit";

export const rateLimiter = ({
    requests = 100, 
    minutes = 15     
} = {}) => {

    return rateLimit({
        windowMs: minutes * 60 * 1000, 
        max: requests,
        standardHeaders: true,
        legacyHeaders: false,

        keyGenerator: (req) => {
            return req.user ? req.user.id : req.ip;
        },

        handler: (req, res) => {
            return res.status(429).json({
                success: false,
                message: "Too many requests",
                limit: req.rateLimit.limit,
                remaining: req.rateLimit.remaining,
                resetTime: req.rateLimit.resetTime
            });
        }
    });
};