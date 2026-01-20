import express from "express";

// Optional routers
// import adminRouter from "./admin/router.js";
// import mobileRouter from "./mobile/router.js";
import authRouter from "./auth.route.js";
import userRouter from "./user.route.js";
import uploadRoutes from "./file.route.js"
import { WHITELIST } from "../config/whitelist.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// -----------------------------------------------------------------------------
// 🔹 Auth APIs (public or partially whitelisted)
// -----------------------------------------------------------------------------
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/upload", uploadRoutes)
// Example endpoints:
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/logout

// -----------------------------------------------------------------------------
// ⚙️ Admin APIs
// -----------------------------------------------------------------------------
if (typeof adminRouter !== "undefined") {
  router.use(
    "/ap",
    authMiddleware(WHITELIST.admin), // use whitelist from config
    adminRouter
  );
}

// -----------------------------------------------------------------------------
// ⚙️ Mobile APIs
// -----------------------------------------------------------------------------
if (typeof mobileRouter !== "undefined") {
  router.use(
    "/ma",
    authMiddleware(WHITELIST.mobile), // use whitelist from config
    mobileRouter
  );
}

export default router;
