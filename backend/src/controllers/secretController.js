const secretService = require("../services/secretService");
const {
  createSecretSchema,
  viewSecretSchema,
  secretIdSchema,
  validate,
} = require("../utils/validators");
const { successResponse, errorResponse } = require("../utils/apiResponse");

function getRequestMeta(req) {
  return {
    ip: req.ip,
    userAgent: req.get("user-agent"),
    userId: req.user?._id || null,
  };
}

async function createSecret(req, res) {
  const { isValid, errors, value } = validate(createSecretSchema, req.body);
  if (!isValid) {
    console.warn("[WARN] createSecret validation failed", {
      bodyKeys: Object.keys(req.body),
      errors,
    });
    return errorResponse(res, 400, "Invalid request data");
  }

  const { secretId, expiresAt } = await secretService.createSecret(value, {
    ...getRequestMeta(req),
  });

  return successResponse(
    res,
    201,
    { secretId, expiresAt, link: `/secret/${secretId}` },
    "Secret created"
  );
}

async function getSecretMetadata(req, res) {
  const { isValid, errors, value } = validate(secretIdSchema, req.params);
  if (!isValid) return errorResponse(res, 400, "Invalid request data");

  const metadata = await secretService.getSecretMetadata(value.secretId);

  return successResponse(res, 200, metadata);
}

async function viewSecret(req, res) {
  const paramCheck = validate(secretIdSchema, req.params);
  if (!paramCheck.isValid) return errorResponse(res, 400, "Invalid request data");

  const bodyCheck = validate(viewSecretSchema, req.body);
  if (!bodyCheck.isValid) return errorResponse(res, 400, "Invalid request data");

  const data = await secretService.viewSecret(
    paramCheck.value.secretId,
    bodyCheck.value.passphrase,
    getRequestMeta(req)
  );

  return successResponse(res, 200, data, "Secret retrieved. It has now been destroyed.");
}

async function deleteSecret(req, res) {
  const { isValid, errors, value } = validate(secretIdSchema, req.params);
  if (!isValid) return errorResponse(res, 400, "Validation failed", errors);

  await secretService.deleteSecret(value.secretId, req.user?._id);

  return successResponse(res, 200, null, "Secret deleted");
}

async function getUserSecrets(req, res) {
  const { secrets } = await secretService.getUserSecrets(req.user._id);

  return successResponse(res, 200, { secrets });
}

module.exports = {
  createSecret,
  getSecretMetadata,
  viewSecret,
  deleteSecret,
  getUserSecrets,
};