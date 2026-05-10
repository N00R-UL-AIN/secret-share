const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      enum: [
        "USER_REGISTERED",
        "USER_LOGIN",
        "USER_LOGIN_FAILED",
        "USER_LOCKED",
        "USER_LOGOUT",
        "TOKEN_REFRESHED",
        "SECRET_CREATED",
        "SECRET_VIEWED",
        "SECRET_EXPIRED",
        "SECRET_DELETED",
        "UNAUTHORIZED_ACCESS",
        "RATE_LIMIT_HIT",
      ],
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    secretId: {
      type: String,
      default: null,
    },

    ipAddressHash: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
      maxlength: 256,
    },

    success: {
      type: Boolean,
      required: true,
    },

    detail: {
      type: String,
      default: null,
      maxlength: 512,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ event: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("AuditLog", auditLogSchema);