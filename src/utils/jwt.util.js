import jwt from "jsonwebtoken";
import config from "../config/index.js";

export class JwtUtils {
    /**
     * Generate a JWT token
     */
    static generateToken(payload, expiresIn = "7d", secret = config.jwtSecret) {
        return jwt.sign(payload, secret, { expiresIn });
    }

    /**
     * Verify a JWT token
     */
    static verifyToken(token, secret = config.jwtSecret) {
        return jwt.verify(token, secret);
    }

    /**
     * Decode token without verification
     */
    static decodeToken(token) {
        return jwt.decode(token);
    }

    /**
     * Generate Access + Refresh token pair
     */
    static generateTokenPair(payload) {
        const accessToken = this.generateToken(payload, "1h");
        const refreshToken = this.generateToken(payload, "7d");
        return { accessToken, refreshToken };
    }

    /**
     * Refresh an expired access token using refresh token
     */
    static refreshAccessToken(refreshToken, customExpiry = "1h") {
        const decoded = this.verifyToken(refreshToken);
        delete decoded.iat;
        delete decoded.exp;
        return this.generateToken(decoded, customExpiry);
    }

    /**
     * Validate Bearer Token format
     */
    static extractBearerToken(header) {
        if (!header) return null;
        if (!header.startsWith("Bearer ")) return null;
        return header.split(" ")[1];
    }

    /**
     * Check if token is expired
     */
    static isExpired(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded?.exp) return true;
            return decoded.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    }

    /**
     * Get remaining time in seconds
     */
    static getRemainingTime(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded?.exp) return 0;
            return decoded.exp - Math.floor(Date.now() / 1000);
        } catch {
            return 0;
        }
    }

    /**
     * Try verifying safely (returns null instead of throwing)
     */
    static safeVerify(token, secret = config.jwtSecret) {
        try {
            return jwt.verify(token, secret);
        } catch {
            return null;
        }
    }

    /**
     * Check if token is valid (boolean)
     */
    static isValid(token, secret = config.jwtSecret) {
        return this.safeVerify(token, secret) !== null;
    }
}
