import { logger } from "./logger.js";
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`);
      next(err);
    });
  };
};

export { asyncHandler };
