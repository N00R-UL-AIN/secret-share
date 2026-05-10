const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { securityConfig } = require("../../config/securityConfig");

function signAccessToken(payload) {
  return jwt.sign(payload, securityConfig.jwt.secret, {
    algorithm: securityConfig.jwt.algorithm,
    expiresIn: securityConfig.jwt.expiresIn,
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, securityConfig.jwt.refreshSecret, {
    algorithm: securityConfig.jwt.algorithm,
    expiresIn: securityConfig.jwt.refreshExpiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, securityConfig.jwt.secret, {
    algorithms: [securityConfig.jwt.algorithm],
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, securityConfig.jwt.refreshSecret, {
    algorithms: [securityConfig.jwt.algorithm],
  });
}

async function hashToken(token) {
  return bcrypt.hash(token, 10);
}

async function compareTokenHash(token, hash) {
  return bcrypt.compare(token, hash);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  compareTokenHash,
};