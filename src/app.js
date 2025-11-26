import cors from "cors";
import express from "express";
import helmet from "helmet";

import { getHealth, getHealthPage } from "./config/health.js";
import { WHITELIST } from "./config/whitelist.js";
import authMiddleware from "./middlewares/auth.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import routes from "./routes/index.js";

const app = express();

// -----------------------------
// Middleware
// -----------------------------
app.use(cors());
app.use(express.json());

// Health check (public)
app.get("/health", getHealthPage);
app.get("/health.json", getHealth);

// -----------------------------
// Helmet only for /api routes
// -----------------------------
app.use("/api", helmet());

// -----------------------------
// Protect APIs with authMiddleware
// -----------------------------
// Use overall whitelist from config
app.use("/api", authMiddleware(WHITELIST.overall), routes);

// -----------------------------
// Global error handler
// -----------------------------
app.use(errorMiddleware);

export default app;
