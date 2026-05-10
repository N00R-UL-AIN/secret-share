const securityConfig = {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
      algorithm: "HS256",
    },
  
    encryption: {
      algorithm: "aes-256-gcm",
      keyLength: 32,
      ivLength: 12,
      tagLength: 16,
      key: Buffer.from(process.env.ENCRYPTION_KEY || "", "hex"),
    },
  
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
      authMax: 10,
      secretMax: 30,
    },
  
    secret: {
      maxSizeBytes: (parseInt(process.env.MAX_SECRET_SIZE_KB, 10) || 64) * 1024,
      defaultTTLHours: parseInt(process.env.DEFAULT_SECRET_TTL_HOURS, 10) || 24,
      maxTTLHours: parseInt(process.env.MAX_SECRET_TTL_HOURS, 10) || 168,
    },
  
    account: {
      maxFailedAttempts: 5,
      lockDurationMs: 15 * 60 * 1000,
    },
  
    cors: {
      allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(","),
    },
  };
  
  function validateSecurityConfig() {
    const errors = [];
  
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
      errors.push("JWT_SECRET must be at least 64 characters");
    }
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 64) {
      errors.push("JWT_REFRESH_SECRET must be at least 64 characters");
    }
    if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 64) {
      errors.push("ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)");
    }
  
    if (errors.length > 0) {
      throw new Error(`Security configuration errors:\n${errors.join("\n")}`);
    }
  }
  
  module.exports = { securityConfig, validateSecurityConfig };