// User model with authentication and security features
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { securityConfig } = require("../../config/securityConfig");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Exclude from queries by default
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Account lockout tracking
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },

    // Token security
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    passwordChangedAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        // Remove sensitive fields from JSON output
        delete ret.password;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        delete ret.refreshTokenHash;
        delete ret.passwordChangedAt;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for automatic account unlock
userSchema.index({ lockUntil: 1 }, { expireAfterSeconds: 0 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, securityConfig.bcryptRounds);
  this.passwordChangedAt = Date.now();
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.incrementFailedAttempts = async function () {
  this.failedLoginAttempts += 1;

  if (this.failedLoginAttempts >= securityConfig.account.maxFailedAttempts) {
    this.lockUntil = new Date(Date.now() + securityConfig.account.lockDurationMs);
  }

  await this.save();
};

userSchema.methods.resetFailedAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

module.exports = mongoose.model("User", userSchema);