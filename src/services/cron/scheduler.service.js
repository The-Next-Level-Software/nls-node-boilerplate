import cron from "node-cron";
import logger from "../../config/logger.js";
import { CRON_CONFIG } from "../../config/cron.config.js";
import { runBackup, runMongoBackup } from "./backup.service.js";

export const initCronJobs = () => {
  logger.info("⏰ Initializing cron jobs...");

  cron.schedule(CRON_CONFIG.BACKUP.SCHEDULE, async () => {
    logger.info("🕒 Running scheduled backup job...");
    await runBackup();
  });

  logger.info("✅ Cron jobs initialized");
};
