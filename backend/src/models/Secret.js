// Secret model for encrypted one-time messages
const mongoose = require("mongoose");

const secretSchema = new mongoose.Schema(
  {
    secretId: {
      type: String,
      required: true,
      unique: true,
    },

    // AES-256-GCM encrypted content
    encryptedContent: {
      type: String,
      required: true,
    },

    iv: {
      type: String,
      required: true,
    },

    authTag: {
      type: String,
      required: true,
    },

    salt: {
      type: String,
      required: true,
    },

    passphrasHash: {
      type: String,
      required: true,
    },

    // Ownership and metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Automatic expiration
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index
    },

    // View tracking (one-time secrets)
    isViewed: {
      type: Boolean,
      default: false,
    },

    viewedAt: {
      type: Date,
      default: null,
    },

    maxViews: {
      type: Number,
      default: 1,
      min: 1,
      max: 1, // Currently only one-time secrets
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    // IP tracking for security
    ipAddressHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        // Remove sensitive encryption data from JSON output
        delete ret.encryptedContent;
        delete ret.iv;
        delete ret.authTag;
        delete ret.passphrasHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for efficient user secret queries
secretSchema.index({ createdBy: 1, createdAt: -1 });

// Virtual for hasPassphrase
secretSchema.virtual("hasPassphrase").get(function () {
  return !!this.passphrasHash;
});

// Instance methods
secretSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

secretSchema.methods.isConsumed = function () {
  return this.isViewed || this.viewCount >= this.maxViews;
};

module.exports = mongoose.model("Secret", secretSchema);