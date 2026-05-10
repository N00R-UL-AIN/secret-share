const express = require("express");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/register", authLimiter, asyncHandler(authController.register));
router.post("/login", authLimiter, asyncHandler(authController.login));
router.post("/refresh", asyncHandler(authController.refresh));
router.post("/logout", authenticate, asyncHandler(authController.logout));
router.get("/me", authenticate, asyncHandler(authController.me));

module.exports = router;