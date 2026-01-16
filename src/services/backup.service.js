import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import backupConfig from "../config/backup.js";
import { fileURLToPath } from "url";
import logger from "../config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




class BackupService {
  constructor() {
    logger.debug("Initializing BackupService");

    if (
      process.env.NODE_ENV === "production" &&
      !backupConfig.allowProduction
    ) {
      logger.error("Backup service blocked in production", true);
      throw new Error("Backup service disabled in production");
    }

    this.backupRoot = path.resolve(
      __dirname,
      "..",
      "..",
      backupConfig.backupDir
    );

    if (!fs.existsSync(this.backupRoot)) {
      fs.mkdirSync(this.backupRoot, { recursive: true });
      logger.info(`Backup directory created: ${this.backupRoot}`);
    } else {
      logger.debug(`Backup directory exists: ${this.backupRoot}`);
    }
  }

  /**
   * Full database backup
   */
  async backupDatabase() {
    if (!backupConfig.enabled) {
      logger.warn("Backup attempt blocked: backups are disabled");
      throw new Error("Backup is disabled by configuration");
    }

    logger.info("Starting full database backup", true);

    const collections = await mongoose.connection.db.collections();
    logger.debug(`Found ${collections.length} collections`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const backupPath = path.join(
      this.backupRoot,
      `backup_${timestamp}`
    );

    fs.mkdirSync(backupPath);
    logger.info(`Backup folder created: ${backupPath}`);

    let totalRecords = 0;

    for (const collection of collections) {
      logger.debug(`Backing up collection: ${collection.collectionName}`);

      const data = await collection.find({}).toArray();
      totalRecords += data.length;

      const filePath = path.join(
        backupPath,
        `${collection.collectionName}.json`
      );

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      logger.info(
        `✔ ${collection.collectionName} backed up (${data.length} records)`
      );
    }

    logger.info(
      `Database backup completed. Total records: ${totalRecords}`,
      true
    );

    return {
      path: backupPath,
      collections: collections.map((c) => c.collectionName),
      totalRecords,
      createdAt: new Date(),
    };
  }

  /**
   * Single collection backup
   */
  async backupCollection(collectionName) {
    logger.info(`Starting backup for collection: ${collectionName}`, true);

    const collection =
      mongoose.connection.db.collection(collectionName);

    const data = await collection.find({}).toArray();

    const filePath = path.join(
      this.backupRoot,
      `${collectionName}_${Date.now()}.json`
    );

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    logger.info(
      `✔ Collection ${collectionName} backed up (${data.length} records)`
    );

    return {
      collection: collectionName,
      records: data.length,
      filePath,
    };
  }
  /**
    * Stream a single backup from MongoDB directly to client
    * @param {string} timestampFolder - optional, for naming the zip
    * @param {Response} res - Express response object
    */
  async streamBackupFromDatabase(res, timestampFolder = null) {
    const archive = archiver("zip", { zlib: { level: 9 } });

    // Set zip filename
    const zipName = timestampFolder
      ? `${timestampFolder}.zip`
      : `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;

    res.attachment(zipName);
    archive.pipe(res);

    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
      const data = await collection.find({}).toArray();
      archive.append(JSON.stringify(data, null, 2), { name: `${collection.collectionName}.json` });
    }

    await archive.finalize();
  }

  /**
   * Stream all MongoDB data as a single zip to client
   * @param {Response} res - Express response object
   */
  async streamAllBackupsFromDatabase(res) {
    const archive = archiver("zip", { zlib: { level: 9 } });

    const zipName = `all_backups_${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
    res.attachment(zipName);
    archive.pipe(res);

    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
      const data = await collection.find({}).toArray();
      archive.append(JSON.stringify(data, null, 2), { name: `${collection.collectionName}.json` });
    }

    await archive.finalize();
  }
}

export default new BackupService();
