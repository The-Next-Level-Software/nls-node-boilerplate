import express from "express";
import helmet from "helmet";
import cors from "cors";
import routes from "./routes/index.js";
import { getHealthPage } from "./startup/health.js";
import { protect } from "./services/auth.service.js";

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
// Protect APIs
// -----------------------------
const whitelist = ["/login", "/register"]; // Public APIs
app.use("/api", protect(whitelist), routes);


export default app;
