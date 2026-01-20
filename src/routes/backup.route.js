import express from "express";
import BackupController from "../controllers/backup.controller.js";
import adminMiddleware from "../middlewares/admin.middleware.js";

const router = express.Router();

router.get(
    "/download/:timestamp",
    adminMiddleware,
    BackupController.downloadBackup
);

router.get(
    "/download",
    adminMiddleware,
    BackupController.downloadBackup
);

export default router;
