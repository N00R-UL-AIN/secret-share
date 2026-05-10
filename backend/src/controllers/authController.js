// Authentication controller handling user registration, login, and token management
const authService = require("../services/authService");
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  validate,
} = require("../utils/validators");
const { successResponse, errorResponse } = require("../utils/apiResponse");

// Extract metadata from request for logging
function getMeta(req) {
  return {
    ip: req.ip,
    userAgent: req.get("user-agent"),
    ipAddressHash: require("../utils/encryption").hashIp(req.ip),
  };
}

async function register(req, res) {
  const { isValid, errors, value } = validate(registerSchema, req.body);
  if (!isValid) return errorResponse(res, 400, "Validation failed", errors);

  const { user } = await authService.register(value.email, value.password);
  return successResponse(res, 201, { user }, "Account created successfully");
}

async function login(req, res) {
  const { isValid, errors, value } = validate(loginSchema, req.body);
  if (!isValid) return errorResponse(res, 400, "Validation failed", errors);

  const { accessToken, refreshToken, user } = await authService.login(
    value.email,
    value.password,
    getMeta(req)
  );

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth/refresh",
  });

  return successResponse(res, 200, { accessToken, user }, "Login successful");
}

async function refresh(req, res) {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  const { isValid, errors, value } = validate(refreshTokenSchema, { refreshToken });
  if (!isValid) return errorResponse(res, 400, "Validation failed", errors);

  const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(
    value.refreshToken,
    getMeta(req)
  );

  // Update refresh token cookie
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth/refresh",
  });

  return successResponse(res, 200, { accessToken }, "Token refreshed");
}

async function logout(req, res) {
  await authService.logout(req.user._id, getMeta(req));

  // Clear refresh token cookie
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

  return successResponse(res, 200, null, "Logged out successfully");
}

async function me(req, res) {
  return successResponse(res, 200, { user: req.user });
}

module.exports = { register, login, refresh, logout, me };