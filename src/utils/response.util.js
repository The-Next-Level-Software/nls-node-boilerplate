/**
 * Unified API response generator
 * Handles both success and error responses in a clean, consistent format.
 * 
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response message
 * @param {object} [data={}] - Optional response data
 * @param {boolean} [isSuccess] - Explicit success flag (auto-detected if not provided)
 */
export function generateApiResponse(res, statusCode, message, data = {}, isSuccess) {
  const success = typeof isSuccess === "boolean"
    ? isSuccess
    : statusCode >= 200 && statusCode < 300;

  return res.status(statusCode).json({
    statusCode,
    isSuccess: success,
    message,
    ...data,
  });
}

/**
 * Error response generator with automatic API path formatting
 * @param {Response} res - Express response object
 * @param {Error|string} error - Error object or message
 * @param {object} [extraData={}] - Optional extra data to include in response
 */
export function generateErrorApiResponse(res, error, extraData = {}) {
  const apiPath = res.req?.originalUrl || "";
  const pathSegments = apiPath.split("?")[0].split("/").filter(Boolean);

  // Find last static segment (not dynamic like ":id")
  const lastStaticSegment =
    pathSegments.reverse().find(seg => !seg.startsWith(":") && isNaN(seg)) || "unknown";

  // Format: replace hyphens → spaces, capitalize
  const formattedSegment = lastStaticSegment
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());

  const message =
    typeof error === "string"
      ? error
      : `Error occurred while ${formattedSegment.toLowerCase()}`;

  console.error(`[API ERROR] ${apiPath}:`, error?.message || error);

  return res.status(500).json({
    statusCode: 500,
    isSuccess: false,
    message,
    ...extraData,
  });
}
