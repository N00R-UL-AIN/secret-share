const rateLimit = require("express-rate-limit");
const { securityConfig } = require("../../config/securityConfig");

const globalLimiter = rateLimit({
  windowMs: securityConfig.rateLimit.windowMs,
  max: securityConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
  skip: (req) => req.method === "OPTIONS",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: securityConfig.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts. Try again in 15 minutes." },
  keyGenerator: (req) => req.ip + (req.body?.email || ""),
});

const secretCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: securityConfig.rateLimit.secretMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Secret creation limit reached. Try again later." },
});

module.exports = { globalLimiter, authLimiter, secretCreateLimiter };