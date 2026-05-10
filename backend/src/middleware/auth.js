const User = require("../models/User");
const { verifyAccessToken } = require("../utils/jwt");
const { errorResponse } = require("../utils/apiResponse");
const auditService = require("../services/auditService");
const { hashIp } = require("../utils/encryption");

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(res, 401, "Authentication required");
  }

  const token = authHeader.split(" ")[1];

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    const msg = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return errorResponse(res, 401, msg);
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    await auditService.log("UNAUTHORIZED_ACCESS", {
      ipAddressHash: hashIp(req.ip),
      userAgent: req.get("user-agent"),
      success: false,
      detail: "User not found or inactive",
    });
    return errorResponse(res, 401, "Authentication required");
  }

  req.user = user;
  next();
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  return authenticate(req, res, next);
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(res, 403, "Insufficient permissions");
    }
    next();
  };
}

module.exports = { authenticate, optionalAuth, requireRole };