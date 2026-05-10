const AuditLog = require("../models/AuditLog");

async function log(event, { userId, secretId, ipAddressHash, userAgent, success, detail } = {}) {
  try {
    await AuditLog.create({
      event,
      userId: userId || null,
      secretId: secretId || null,
      ipAddressHash: ipAddressHash || null,
      userAgent: userAgent ? userAgent.substring(0, 256) : null,
      success,
      detail: detail ? detail.substring(0, 512) : null,
    });
  } catch {
    console.error(`Failed to write audit log for event: ${event}`);
  }
}

module.exports = { log };