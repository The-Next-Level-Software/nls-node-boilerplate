import express from "express";
import AuthController from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

// =======================
// 🔹 AUTH ROUTES
// =======================

// Register
router.post(
    "/register",
    validate(["name", "email", "password"]),
    AuthController.register
);

// Login
router.post(
    "/login",
    validate(
        ["email", "password"],
        "body",
        { password: { skipLengthCheck: true } }
    ),
    AuthController.login
);

// Refresh Token
router.post(
    "/refresh-token",
    validate(["refreshToken"]),
    AuthController.refreshToken
);

// Logout (current device / session)
router.post(
    "/logout",
    AuthController.logout
);

// Logout from ALL devices
router.post(
    "/logout-all",
    AuthController.logoutAll
);

// Get logged-in user (ME endpoint)
router.get(
    "/me",
    AuthController.getMe
);

export default router;
