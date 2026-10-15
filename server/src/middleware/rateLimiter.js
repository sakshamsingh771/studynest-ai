const rateLimit = require("express-rate-limit");

// Tighter limit specifically on auth routes — this is the endpoint brute-force
// and credential-stuffing attacks actually target.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    error: { code: "TOO_MANY_REQUESTS", message: "Too many attempts. Please try again later." },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Burst guard on every costly AI route (separate from the per-plan daily quota in
// ai.service.js): stops script loops from hammering the paid provider.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  keyGenerator: (req) => (req.user?._id ? req.user._id.toString() : req.ip),
  message: {
    success: false,
    error: { code: "TOO_MANY_REQUESTS", message: "You're sending AI requests too quickly. Please wait a minute." },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, aiLimiter };
