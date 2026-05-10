const { errorResponse } = require("../utils/apiResponse");

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === "development";

  if (statusCode >= 500) {
    console.error(`[ERROR] ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, 400, "Validation error", messages);
  }

  if (err.code === 11000) {
    return errorResponse(res, 409, "Resource already exists");
  }

  if (err.name === "CastError") {
    return errorResponse(res, 400, "Invalid identifier format");
  }

  const message = statusCode < 500
    ? err.message
    : isDev
    ? err.message
    : "An internal server error occurred";

  return errorResponse(res, statusCode, message);
}

function notFoundHandler(req, res) {
  return errorResponse(res, 404, "Route not found");
}

module.exports = { errorHandler, notFoundHandler };