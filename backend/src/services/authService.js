// Authentication service handling user registration, login, and token operations
const User = require("../models/User");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  compareTokenHash,
} = require("../utils/jwt");
const auditService = require("./auditService");

async function register(email, password) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw Object.assign(new Error("Email already registered"), { statusCode: 409 });
  }

  const user = await User.create({ email, password });
  return { user };
}

async function login(email, password, meta) {
  const user = await User.findOne({ email }).select(
    "+password +failedLoginAttempts +lockUntil"
  );

  if (!user || !user.isActive) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  if (user.isLocked()) {
    await auditService.log("USER_LOCKED", { userId: user._id, ...meta, success: false });
    throw Object.assign(
      new Error("Account temporarily locked. Try again later."),
      { statusCode: 423 }
    );
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    await user.incrementFailedAttempts();
    await auditService.log("USER_LOGIN_FAILED", {
      userId: user._id,
      ...meta,
      success: false,
    });

    if (user.failedLoginAttempts >= 5) {
      await auditService.log("USER_LOCKED", { userId: user._id, ...meta, success: false });
    }

    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  // Successful login - reset failed attempts
  await user.resetFailedAttempts();

  const accessToken = signAccessToken({ sub: user._id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user._id });

  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  await auditService.log("USER_LOGIN", { userId: user._id, ...meta, success: true });

  return { accessToken, refreshToken, user };
}

async function refreshAccessToken(refreshToken, meta) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw Object.assign(new Error("Invalid or expired refresh token"), { statusCode: 401 });
  }

  const user = await User.findById(payload.sub).select("+refreshTokenHash");

  if (!user || !user.isActive || !user.refreshTokenHash) {
    throw Object.assign(new Error("Invalid session"), { statusCode: 401 });
  }

  const isValid = await compareTokenHash(refreshToken, user.refreshTokenHash);
  if (!isValid) {
    // Token reuse detected - invalidate session
    user.refreshTokenHash = null;
    await user.save();
    throw Object.assign(new Error("Refresh token reuse detected"), { statusCode: 401 });
  }

  // Issue new token pair
  const newAccessToken = signAccessToken({ sub: user._id, role: user.role });
  const newRefreshToken = signRefreshToken({ sub: user._id });

  user.refreshTokenHash = await hashToken(newRefreshToken);
  await user.save();

  await auditService.log("TOKEN_REFRESHED", { userId: user._id, ...meta, success: true });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

async function logout(userId, meta) {
  const user = await User.findById(userId).select("+refreshTokenHash");
  if (user) {
    user.refreshTokenHash = null;
    await user.save();
  }

  await auditService.log("USER_LOGOUT", { userId, ...meta, success: true });
}

module.exports = { register, login, refreshAccessToken, logout };