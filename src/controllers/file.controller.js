import { fileService } from "../services/file.service.js";
import { generateApiResponse, generateErrorApiResponse } from "../utils/response.util.js";

export class FileController {
    // ==================== LOCAL FILE PROVIDER ====================

    static async uploadLocalFile(req, res) {
        try {
            const file = await fileService.uploadSingle({
                file: req.file,
                options: {},
                provider: "local",
            });
            return generateApiResponse(res, 200, "Local file uploaded", { file });
        } catch (err) {
            return generateErrorApiResponse(res, 500, err);
        }
    }

    static async uploadLocalImage(req, res) {
        try {
            const file = await fileService.uploadSingle({
                file: req.file,
                options: { compress: true },
                provider: "local",
            });
            return generateApiResponse(res, 200, "Local image uploaded and compressed", { file });
        } catch (err) {
            return generateErrorApiResponse(res, 500, err);
        }
    }

    static async uploadLocalFiles(req, res) {
        try {
            const files = await fileService.uploadMultiple({
                files: req.files,
                options: {},
                provider: "local",
            });
            return generateApiResponse(res, 200, "Local files uploaded", { files });
        } catch (err) {
            return generateErrorApiResponse(res, 500, err);
        }
    }

    static async uploadLocalImages(req, res) {
        try {
            const files = await fileService.uploadMultiple({
                files: req.files,
                options: { compress: true },
                provider: "local",
            });
            return generateApiResponse(res, 200, "Local images uploaded and compressed", { files });
        } catch (err) {
            return generateErrorApiResponse(res, 500, err);
        }
    }

    static async uploadLocalFields(req, res) {
        try {
            const uploaded = [];

            // req.files is an object with field names as keys
            for (const fieldName in req.files) {
                const filesArray = req.files[fieldName];
                for (const file of filesArray) {
                    // Use your fileService to upload each file
                    const uploadedFile = await fileService.uploadSingle({
                        file,
                        options: fieldName === "image" ? { compress: true } : {}, // compress images
                        provider: "local",
                    });
                    uploaded.push({ field: fieldName, ...uploadedFile });
                }
            }

            return generateApiResponse(res, 200, "Files uploaded locally from multiple fields", { uploaded });
        } catch (err) {
            return generateErrorApiResponse(res, 500, err);
        }
    }


    // ==================== S3 FILE PROVIDER ====================

    static async uploadS3File(req, res) {
        try {
            const file = await fileService.uploadSingle({
                file: req.file,
                options: {},
                provider: "s3",
            });
            return generateApiResponse(res, 200, "S3 file uploaded", { file });
        } catch (err) {
            return generateErrorApiResponse(res, 500, err);
        }
    }

    static async uploadS3Image(req, res) {
        try {
            const file = await fileService.uploadSingle({
                file: req.file,
                options: {},
                provider: "s3",
            });
            return generateApiResponse(res, 200, "S3 image uploaded", { file });
        } catch (err) {
            return generateErrorApiResponse(res, 500, err);
        }
    }

    static async uploadS3Files(req, res) {
        try {
            const files = await fileService.uploadMultiple({
                files: req.files,
                options: {},
                provider: "s3",
            });
            return generateApiResponse(res, 200, "S3 files uploaded", { files });
        } catch (err) {
            return generateErrorApiResponse(res, 500, err);
        }
    }

    static async uploadS3Images(req, res) {
        try {
            const files = await fileService.uploadMultiple({
                files: req.files,
                options: {},
                provider: "s3",
            });
            return generateApiResponse(res, 200, "S3 images uploaded", { files });
        } catch (err) {
            return generateErrorApiResponse(res, 500, err);
        }
    }

    static async uploadS3Fields(req, res) {
        try {
            const uploaded = [];

            // req.files is an object with keys = field names
            for (const fieldName in req.files) {
                const filesArray = req.files[fieldName];
                for (const file of filesArray) {
                    const uploadedFile = await fileService.uploadSingle({
                        file,
                        options: {},
                        provider: "s3",
                    });
                    uploaded.push({ field: fieldName, ...uploadedFile });
                }
            }

            return generateApiResponse(res, 200, "Files uploaded to S3 from multiple fields", { uploaded });
        } catch (err) {
            return generateErrorApiResponse(res, 500, err);
        }
    }
}
