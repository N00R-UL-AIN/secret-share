const express = require("express");
const secretController = require("../controllers/secretController");
const { authenticate, optionalAuth } = require("../middleware/auth");
const { secretCreateLimiter } = require("../middleware/rateLimiter");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/", authenticate, secretCreateLimiter, asyncHandler(secretController.createSecret));

router.get("/my", authenticate, asyncHandler(secretController.getUserSecrets));

router.get("/:secretId", asyncHandler(secretController.getSecretMetadata));

router.post("/:secretId/view", optionalAuth, asyncHandler(secretController.viewSecret));

router.delete("/:secretId", authenticate, asyncHandler(secretController.deleteSecret));

module.exports = router;