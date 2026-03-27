import { exec, execSync } from "child_process";
import path from "path";
import util from "util";
import fs from "fs";
import mongoose from "mongoose";
import logger from "../../config/logger.js";
import appConfig from "../../config/index.js";
import { createBackupFolder, deleteOldBackups } from "../../utils/backup.util.js";
import { CRON_CONFIG } from "../../config/cron.config.js";

const execAsync = util.promisify(exec);

const {
  db: { mongoUri },
} = appConfig;

const isMongoDumpAvailable = () => {
  try {
    execSync("mongodump --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

export const runMongoBackup = async () => {
  try {
    if (!isMongoDumpAvailable()) {
      logger.error("❌ mongodump not installed or not in PATH. Skipping backup.");
      return;
    }

    logger.info("📦 Starting MongoDB backup...");

    const basePath = path.join(process.cwd(), CRON_CONFIG.BACKUP.BACKUP_DIR);
    const backupFolder = createBackupFolder(basePath);

    // 1. Run mongodump to a temporary subfolder
    const tempDumpPath = path.join(backupFolder, "dump");
    const command = `mongodump --uri="${mongoUri}" --out="${tempDumpPath}"`;

    logger.debug(`Running: ${command}`);
    const { stderr } = await execAsync(command);

    if (stderr) logger.warn(`mongodump stderr: ${stderr}`);

    // 2. Flatten: Move all .json files to root and convert .bson if needed (or just keep metadata + data)
    // For simplicity, we copy the .json files (mongoexport-style) or keep .bson + metadata
    const dbFolders = fs
      .readdirSync(tempDumpPath)
      .filter((name) => fs.statSync(path.join(tempDumpPath, name)).isDirectory());

    let successCount = 0;

    for (const dbName of dbFolders) {
      const dbPath = path.join(tempDumpPath, dbName);
      const files = fs.readdirSync(dbPath);

      for (const file of files) {
        if (file.endsWith(".metadata.json") || file.endsWith(".bson")) {
          const source = path.join(dbPath, file);
          const destination = path.join(
            backupFolder,
            file.replace(".metadata.json", ".metadata.json").replace(".bson", ".bson")
          );
          fs.copyFileSync(source, destination);
          successCount++;
        }
      }
    }

    // Clean up temporary dump folder
    fs.rmSync(tempDumpPath, { recursive: true, force: true });

    logger.info(`✅ Backup completed! ${successCount} files in ${backupFolder}`);

    // Clean old backups
    deleteOldBackups(basePath, CRON_CONFIG.BACKUP.RETENTION_COUNT);
  } catch (err) {
    logger.error(`💥 Backup Service Error: ${err.message}`);
  }
};

export const runManualBackup = async () => {
  try {
    logger.info("📦 Starting Manual MongoDB backup...");

    const basePath = path.join(process.cwd(), CRON_CONFIG.BACKUP.BACKUP_DIR);
    const backupFolder = createBackupFolder(basePath);

    const collections = mongoose.connection.collections;

    let totalDocs = 0;

    for (const key in collections) {
      const collection = collections[key];
      const filePath = path.join(backupFolder, `${key}.json`);

      logger.info(`📁 Backing up collection: ${key}`);

      const writeStream = fs.createWriteStream(filePath);
      writeStream.write("[\n");

      const cursor = collection.find().stream();

      let first = true;

      await new Promise((resolve, reject) => {
        cursor.on("data", (doc) => {
          totalDocs++;

          if (!first) {
            writeStream.write(",\n");
          }

          writeStream.write(JSON.stringify(doc));
          first = false;
        });

        cursor.on("end", () => {
          writeStream.write("\n]");
          writeStream.end();
          resolve();
        });

        cursor.on("error", (err) => {
          reject(err);
        });
      });
    }

    logger.info(`✅ Manual backup completed. Total docs: ${totalDocs}`);

    // Cleanup old backups
    deleteOldBackups(basePath, CRON_CONFIG.BACKUP.RETENTION_COUNT);
  } catch (err) {
    logger.error(`💥 Manual Backup Error: ${err.message}`);
  }
};

export const runBackup = async () => {
  if (appConfig.backup.useMongoDump) {
    logger.info("🔁 Using mongodump backup strategy");
    return runMongoBackup();
  } else {
    logger.info("🔁 Using manual backup strategy");
    return runManualBackup();
  }
};
