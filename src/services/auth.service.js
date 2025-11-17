// src/services/auth.service.js

import { JwtUtils } from "../utils/jwt.util.js";

/**
 * Generate Access + Refresh Token Pair
 */
export const generateAuthTokens = async (user) => {
    const payload = {
        id: user.id || user._id,
        email: user.email,
        role: user.role || "user",
    };

    return JwtUtils.generateTokenPair(payload);
};

/**
 * Login handler used inside controllers
 */
export const loginService = async (user) => {
    const tokens = await generateAuthTokens(user);

    return {
        user: {
            id: user.id || user._id,
            name: user.name,
            email: user.email,
            role: user.role || "user",
        },
        tokens,
    };
};

/**
 * Refresh token service
 */
export const refreshTokenService = async (refreshToken) => {
    if (!refreshToken) {
        throw new Error("Refresh token is required");
    }

    // Validate refresh token
    const decoded = JwtUtils.safeVerify(refreshToken);
    if (!decoded) {
        throw new Error("Invalid or expired refresh token");
    }

    // Generate new access token
    const newAccessToken = JwtUtils.refreshAccessToken(refreshToken);

    return { accessToken: newAccessToken };
};

/**
 * Logout service (for future blacklisting if required)
 */
export const logoutService = async () => {
    // If you add token blacklisting later, handle here
    return { message: "Logged out successfully" };
};
