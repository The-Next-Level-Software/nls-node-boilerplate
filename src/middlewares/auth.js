// src/middlewares/auth.middleware.js
import { verifyToken } from "../utils/jwt.util.js";

const auth = (req, res, next) => {
    try {
        let token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Token missing",
            });
        }

        // Support: "Bearer <token>" OR "<token>"
        if (token.startsWith("Bearer ")) {
            token = token.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid token format",
            });
        }

        // Verify token
        const decoded = verifyToken(token);

        // Attach decoded payload to req.user
        req.user = decoded;

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

export default auth;
