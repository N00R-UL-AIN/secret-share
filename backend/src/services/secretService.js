const bcrypt = require("bcryptjs");
const Secret = require("../models/Secret");
const { encrypt, decrypt, generateSecureId, hashIp } = require("../utils/encryption");
const { securityConfig } = require("../../config/securityConfig");
const auditService = require("./auditService");

async function createSecret({ encryptedContent, iv, authTag, salt, passphrase, ttlHours }, { userId, ip, userAgent }) {
  const secretId = generateSecureId();

  const passphrasHash = await bcrypt.hash(passphrase, securityConfig.bcryptRounds);

  const ttl = Math.min(ttlHours || securityConfig.secret.defaultTTLHours, securityConfig.secret.maxTTLHours);
  const expiresAt = new Date(Date.now() + ttl * 60 * 60 * 1000);

  await Secret.create({
    secretId,
    encryptedContent,
    iv,
    authTag,
    salt,
    passphrasHash,
    createdBy: userId || null,
    expiresAt,
    ipAddressHash: hashIp(ip),
  });

  await auditService.log("SECRET_CREATED", {
    secretId,
    userId: userId || null,
    ipAddressHash: hashIp(ip),
    userAgent,
    success: true,
  });

  return { secretId, expiresAt };
}

async function getSecretMetadata(secretId) {
  const secret = await Secret.findOne({ secretId });

  if (!secret) {
    throw Object.assign(new Error("Secret not found"), { statusCode: 404 });
  }

  if (secret.isExpired() || secret.isConsumed()) {
    throw Object.assign(new Error("Secret not found or already viewed"), { statusCode: 404 });
  }

  return {
    hasPassphrase: secret.hasPassphrase,
    expiresAt: secret.expiresAt,
  };
}

async function viewSecret(secretId, passphrase, { ip, userAgent, userId }) {
  const secret = await Secret.findOne({ secretId }).select(
    "+encryptedContent +iv +authTag +salt +passphrasHash"
  );

  if (!secret || secret.isExpired() || secret.isConsumed()) {
    await auditService.log("SECRET_VIEWED", {
      secretId,
      userId: userId || null,
      ipAddressHash: hashIp(ip),
      userAgent,
      success: false,
      detail: "Not found or already consumed",
    });
    throw Object.assign(new Error("Secret not found or already viewed"), { statusCode: 404 });
  }

  const passphraseMatch = await bcrypt.compare(passphrase, secret.passphrasHash);
  if (!passphraseMatch) {
    await auditService.log("SECRET_VIEWED", {
      secretId,
      userId: userId || null,
      ipAddressHash: hashIp(ip),
      userAgent,
      success: false,
      detail: "Wrong passphrase",
    });
    throw Object.assign(new Error("Incorrect passphrase"), { statusCode: 403 });
  }

  secret.isViewed = true;
  secret.viewedAt = new Date();
  secret.viewCount += 1;
  await secret.save();

  await auditService.log("SECRET_VIEWED", {
    secretId,
    userId: userId || null,
    ipAddressHash: hashIp(ip),
    userAgent,
    success: true,
  });

  return { encryptedContent: secret.encryptedContent, iv: secret.iv, authTag: secret.authTag, salt: secret.salt };
}

async function deleteSecret(secretId, userId) {
  const query = { secretId };
  if (userId) query.createdBy = userId;

  const secret = await Secret.findOneAndDelete(query);

  if (!secret) {
    throw Object.assign(new Error("Secret not found or not authorized"), { statusCode: 404 });
  }

  await auditService.log("SECRET_DELETED", { secretId, userId, success: true });

  return { deleted: true };
}

async function getUserSecrets(userId) {
  const secrets = await Secret.find(
    { createdBy: userId, isViewed: false, expiresAt: { $gt: new Date() } },
    { secretId: 1, hasPassphrase: 1, expiresAt: 1, createdAt: 1, isViewed: 1 }
  )
    .sort({ createdAt: -1 })
    .limit(100);

  return { secrets };
}

module.exports = { createSecret, getSecretMetadata, viewSecret, deleteSecret, getUserSecrets };