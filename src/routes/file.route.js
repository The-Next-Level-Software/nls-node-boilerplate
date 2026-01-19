import express from "express";
import { FileController } from "../controllers/FileController.js";
import { uploadMiddleware } from "../middlewares/upload.middleware.js";

const router = express.Router();

// ================= LOCAL =================

// Single file upload (field: 'file')
router.post("/local/file", uploadMiddleware({ type: "single", field: "file" }), FileController.uploadLocalFile);

// Single image upload (field: 'image')
router.post("/local/image", uploadMiddleware({ type: "single", field: "image" }), FileController.uploadLocalImage);

// Multiple files upload (field: 'files', max 10)
router.post("/local/files", uploadMiddleware({ type: "multiple", field: "files", maxCount: 10 }), FileController.uploadLocalFiles);

// Multiple images upload (field: 'images', max 10)
router.post("/local/images", uploadMiddleware({ type: "multiple", field: "images", maxCount: 10 }), FileController.uploadLocalImages);

// ===== Local multiple fields upload (file + image together) =====
router.post("/local/all", uploadMiddleware({ type: "fields", fields: ["file", "image"], maxCount: 5 }), FileController.uploadLocalFields);


// ================= S3 =================

// Single file upload (field: 'file')
router.post("/s3/file", uploadMiddleware({ type: "single", field: "file" }), FileController.uploadS3File);

// Single image upload (field: 'image')
router.post("/s3/image", uploadMiddleware({ type: "single", field: "image" }), FileController.uploadS3Image);

// Multiple files upload (field: 'files', max 10)
router.post("/s3/files", uploadMiddleware({ type: "multiple", field: "files", maxCount: 10 }), FileController.uploadS3Files);

// Multiple images upload (field: 'images', max 10)
router.post("/s3/images", uploadMiddleware({ type: "multiple", field: "images", maxCount: 10 }), FileController.uploadS3Images);

// ===== S3 multiple fields upload (file + image together) =====
router.post("/s3/all", uploadMiddleware({ type: "fields", fields: ["file", "image"], maxCount: 5 }), FileController.uploadS3Fields);


export default router;
