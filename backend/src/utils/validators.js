const Joi = require("joi");
const { securityConfig } = require("../../config/securityConfig");

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/)
  .required()
  .messages({
    "string.pattern.base":
      "Password must contain at least one uppercase, one lowercase, one digit, and one special character",
    "string.min": "Password must be at least 8 characters",
    "string.max": "Password must be at most 128 characters",
  });

const registerSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).max(254).required().lowercase(),
  password: passwordSchema,
});

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).max(254).required().lowercase(),
  password: Joi.string().max(128).required(),
});

const createSecretSchema = Joi.object({
  encryptedContent: Joi.string().required(),
  iv: Joi.string().required(),
  authTag: Joi.string().required(),
  salt: Joi.string().required(),
  passphrase: Joi.string().min(4).max(128).required(),
  ttlHours: Joi.number()
    .integer()
    .min(1)
    .max(securityConfig.secret.maxTTLHours)
    .default(securityConfig.secret.defaultTTLHours),
});

const viewSecretSchema = Joi.object({
  passphrase: Joi.string().trim().min(4).max(128).required(),
});

const secretIdSchema = Joi.object({
  secretId: Joi.string().hex().length(32).required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

function validate(schema, data) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const messages = error.details.map((d) => d.message);
    return { isValid: false, errors: messages, value: null };
  }

  return { isValid: true, errors: [], value };
}

module.exports = {
  registerSchema,
  loginSchema,
  createSecretSchema,
  viewSecretSchema,
  secretIdSchema,
  refreshTokenSchema,
  validate,
};