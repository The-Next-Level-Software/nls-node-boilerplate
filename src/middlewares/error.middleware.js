import mongoose from "mongoose";

import logger from "../config/logger.js";
import { generateErrorApiResponse } from "../utils/response.util.js";
import { StringUtils } from "../utils/string.util.js";

const errorMiddleware = (err, req, res, next) => {
  logger.error(`❌ Error code: ${err.code}`);
  logger.error(`❌ [GlobalError] ${err.stack || err}`);

  let statusCode = 500;
  let message = "An unexpected error occurred.";
  let data = {};

  // Mongo duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    const value = err.keyValue?.[field];
    // message = `A record with ${field} '${value}' already exists.`;
    message = `${StringUtils.capitalize(field)} already exists.`;
    statusCode = 409;
  }
  // Validation
  else if (err instanceof mongoose.Error.ValidationError) {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    statusCode = 400;
  }
  // Cast / ObjectId
  else if (err instanceof mongoose.Error.CastError) {
    message = `Invalid ${err.path}: "${err.value}".`;
    statusCode = 400;
  }
  // Use custom message if present
  else if (err.message) {
    message = err.message;
  }

  // Include error object in development mode
  if (process.env.NODE_ENV === "development") {
    data.error = err;
  }

  logger.warn(`ERROR: ${data}`);

  return generateErrorApiResponse(res, statusCode, message, data, false);
};

export default errorMiddleware;
