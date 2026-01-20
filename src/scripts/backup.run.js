import dotenv from "dotenv";
import mongoose from "mongoose";
import backupService from "../services/backup.service.js";
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, "../../.env.dev"),
});

const runBackup = async () => {
    try {
        console.log("🔄 Connecting to database...", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);

        console.log("📦 Starting database backup...");
        const result = await backupService.backupDatabase();

        console.log("✅ Backup completed successfully");
        console.log(result);

        process.exit(0);
    } catch (error) {
        console.error("❌ Backup failed:", error.message);
        process.exit(1);
    }
};

runBackup();
