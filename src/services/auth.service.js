// src/services/auth.service.js
import Session from "../models/session.model.js";
import { JwtUtils } from "../utils/jwt.util.js";

class AuthService {

    /**
     * User payload for JWT
     */
    static getUserPayload(user) {
        return {
            _id: user._id,
            email: user.email,
            name: user.name,
            username: user?.username,
            role: user.role,
        };
    }

    /**
     * Generate Access + Refresh Tokens + Create Session
     */
    static async generateAuthTokens(user, req) {
        const payload = this.getUserPayload(user);

        const { accessToken, refreshToken } = JwtUtils.generateTokenPair(payload);

        // Save refresh token per-device session
        await Session.create({
            userId: user._id,
            refreshToken,
            ip: req?.ip,
            userAgent: req?.headers["user-agent"],
            isActive: true
        });

        return { accessToken, refreshToken };
    }

    /**
     * Refresh Token Handler
     */
    static async refreshToken(refreshToken) {
        if (!refreshToken) throw new Error("Refresh token is required");

        const session = await Session.findOne({ refreshToken, isActive: true });
        if (!session) throw new Error("Invalid or expired session");

        const decoded = JwtUtils.safeVerify(refreshToken);
        if (!decoded) throw new Error("Invalid or expired refresh token");

        const accessToken = JwtUtils.refreshAccessToken(refreshToken);
        return { accessToken };
    }

    /**
     * Logout from current device
     */
    static async logout(refreshToken) {
        
        if (!refreshToken) return { message: "Already logged out" };
        await Session.updateOne(
            { refreshToken },
            { $set: { isActive: false } }
        );

        return { message: "Logged out successfully" };
    }

    /**
     * Logout from all devices
     */
    static async logoutAll(userId) {
        await Session.updateMany(
            { userId },
            { $set: { isActive: false } }
        );

        return { message: "Logged out from all devices" };
    }
}

export default AuthService;
