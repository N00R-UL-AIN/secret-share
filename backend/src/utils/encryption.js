const crypto = require("crypto");
const { securityConfig } = require("../../config/securityConfig");

function encrypt(plaintext) {
  const iv = crypto.randomBytes(securityConfig.encryption.ivLength);

  const cipher = crypto.createCipheriv(
    securityConfig.encryption.algorithm,
    securityConfig.encryption.key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedContent: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

function decrypt(encryptedContent, iv, authTag) {
  const decipher = crypto.createDecipheriv(
    securityConfig.encryption.algorithm,
    securityConfig.encryption.key,
    Buffer.from(iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedContent, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

function hashIp(ip) {
  return crypto
    .createHmac("sha256", securityConfig.jwt.secret)
    .update(ip || "unknown")
    .digest("hex");
}

function generateSecureId() {
  return crypto.randomBytes(16).toString("hex");
}

module.exports = { encrypt, decrypt, hashIp, generateSecureId };