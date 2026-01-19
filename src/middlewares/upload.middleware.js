import multer from "multer";

const storage = multer.memoryStorage();

/**
 * Upload middleware factory for handling multipart/form-data
 *
 * @param {Object} options - Configuration options for upload behavior
 *
 * @param {"single"|"multiple"|"fields"} [options.type="single"]
 * Determines upload mode:
 * - "single"   → accepts one file
 * - "multiple" → accepts multiple files under the same field
 * - "fields"   → accepts multiple files with different field names
 *
 * @param {string} [options.field="file"]
 * Field name for single or multiple uploads
 *
 * @param {string[]} [options.fields=[]]
 * Array of allowed field names (used only when type = "fields")
 *
 * @param {number} [options.maxCount=5]
 * Maximum number of files allowed per field
 *
 * @param {number} [options.maxSize=5242880]
 * Maximum file size in bytes (default: 5MB)
 *
 * @returns {Function}
 * Express middleware function configured for file uploads
 */
export function uploadMiddleware({
    type = "single",
    field = "file",
    fields = [],
    maxCount = 5,
    maxSize = 5 * 1024 * 1024,
} = {}) {
    const upload = multer({
        storage,
        limits: { fileSize: maxSize },
    });

    if (type === "single") {
        return upload.single(field);
    }

    if (type === "fields") {
        return upload.fields(
            fields.map(name => ({ name, maxCount }))
        );
    }

    return upload.array(field, maxCount);
}
