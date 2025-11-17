import express from "express";
import helmet from "helmet";
import cors from "cors";
import routes from "./routes/index.js";
import authMiddleware from "./middlewares/auth.middleware.js";
import { WHITELIST } from "./config/whitelist.js";
import { getHealthPage } from './config/health.js';

const app = express();

// -----------------------------
// Middleware
// -----------------------------
app.use(cors());
app.use(express.json());

// Health check (public)
app.get("/health", getHealthPage);

// -----------------------------
// Helmet only for /api routes
// -----------------------------
app.use("/api", helmet());

// -----------------------------
// Protect APIs with authMiddleware
// -----------------------------
// Use overall whitelist from config
app.use("/api", authMiddleware(WHITELIST.overall), routes);

export default app;
