function successResponse(res, statusCode = 200, data = null, message = "Success") {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function errorResponse(res, statusCode = 500, message = "Internal server error", errors = null) {
  // In production, don't expose detailed errors
  const isDevelopment = process.env.NODE_ENV === "development";
  return res.status(statusCode).json({
    success: false,
    message,
    ...(isDevelopment && errors ? { errors } : {}),
  });
}

module.exports = { successResponse, errorResponse };
