
const express = require("express");
const controller = require("./auth.controller");
const { protect } = require("../../middleware/auth");
const { authLimiter } = require("../../middleware/rateLimiter");

const router = express.Router();

router.post("/signup", authLimiter, controller.signup);
router.post("/login", authLimiter, controller.login);
router.post("/refresh", controller.refresh); // not rate-limited as aggressively — called silently on every page load
router.post("/logout", protect, controller.logout);
router.get("/me", protect, controller.me);
router.post("/forgot-password", authLimiter, controller.forgotPassword);
router.post("/reset-password", authLimiter, controller.resetPassword);
router.post("/verify-email", authLimiter, controller.verifyEmail);
router.post("/resend-verification", protect, authLimiter, controller.resendVerificationEmail);

module.exports = router;