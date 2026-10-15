// Loads and validates environment variables ONCE, at boot.
// If a required secret is missing, the app fails immediately here —
// instead of failing later, silently, the moment a real user hits that code path.
const dotenv = require("dotenv");
dotenv.config();

const REQUIRED_KEYS = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

function loadEnv() {
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Copy .env.example to .env and fill these in.`
    );
  }

  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT) || 5000,
    mongoUri: process.env.MONGO_URI,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    // Set to "true" when the frontend and backend are deployed on DIFFERENT
    // registrable domains (e.g. a Vercel frontend + a Render/Railway backend —
    // the deployment split this project's own README describes). In that case
    // the refresh-token cookie MUST be SameSite=None (with Secure) or the
    // browser silently refuses to send it back on the XHR refresh call, which
    // is the exact root cause of "login works, but the session doesn't persist /
    // the next protected action bounces back to login". Same-origin or
    // same-registrable-domain deployments (or local dev) should leave this
    // unset and keep the stricter SameSite=Lax.
    crossSiteCookies: process.env.CROSS_SITE_COOKIES === "true",
    // Used to build absolute URLs for locally-stored files (e.g. /uploads/xyz.pdf).
    // In production this should be your real API domain (set API_ORIGIN in .env).
    clientApiOrigin: process.env.API_ORIGIN || `http://localhost:${Number(process.env.PORT) || 5000}`,
    // Optional — AI routes check for this themselves and return a clear error if missing,
    // rather than making the whole app fail to boot over a feature-specific key.
    openaiApiKey: process.env.OPENAI_API_KEY || null,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || null,
    smtp: {
      host: process.env.SMTP_HOST || null,
      port: Number(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER || null,
      pass: process.env.SMTP_PASS || null,
      from: process.env.SMTP_FROM || "StudyNest AI <no-reply@studynest.ai>",
    },
  };
}

module.exports = loadEnv();
