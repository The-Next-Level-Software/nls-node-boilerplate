import { StatusCodes } from "http-status-codes";
import backupService from "../services/backup.service.js";
import { generateApiResponse } from './../utils/response.util.js';
import path from "path";
import logger from "../config/logger.js";

class BackupController {
    static async downloadBackup(req, res) {
        try {
            const { timestamp } = req.params;

            if (timestamp) {
                await backupService.streamBackupFromDatabase(timestamp, res);
            } else {
                await backupService.streamAllBackupsFromDatabase(res);
            }

        } catch (error) {
            logger.error(`❌ [BackupController] Error downloading backup:`, error);
            generateApiResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, "Backup download failed", { error: error.message }, false)
        }
    }
}

export default BackupController;
