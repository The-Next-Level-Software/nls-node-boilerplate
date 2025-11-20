// src/config/database.js
import mongoose from "mongoose";
import appConfig from "./index.js";
import logger from "./logger.js";

const { server: { nodeEnv: ENV }, db: { mongoUri: MONGO_URI } } = appConfig;

/**
 * Connects to MongoDB using Mongoose.
 * Automatically retries on failure in development.
 */
export const connectDB = async () => {
    try {
        logger.warn(`🚀 Connecting to MongoDB (${ENV})...`);
        logger.debug(`🔗 URI: ${MONGO_URI}`);

        await mongoose.connect(MONGO_URI);

        logger.info("✅ MongoDB Connected Successfully", true);
        return mongoose.connection;   // <-- FIXED
    } catch (err) {
        logger.error(`❌ MongoDB Connection Error: ${err.message}`);

        if (ENV === "dev") {
            logger.warn("⏳ Retrying connection in 5 seconds...");
            setTimeout(connectDB, 5000);
        } else {
            process.exit(1);
        }

        return null;
    }
};

// -----------------------------------------------------------------------------
// 🧩 Graceful Shutdown
// -----------------------------------------------------------------------------
mongoose.connection.on("disconnected", () => {
    logger.warn("⚠️ MongoDB disconnected", true);
});

process.on("SIGINT", async () => {
    await mongoose.connection.close();
    logger.info("🔒 MongoDB connection closed due to app termination");
    process.exit(0);
});

export default mongoose;
