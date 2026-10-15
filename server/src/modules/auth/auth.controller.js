const authService = require("./auth.service");
const { validateSignup, validateLogin, validateForgotPassword, validateResetPassword } = require("./auth.validation");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const env = require("../../config/env");
const AppError = require("../../utils/AppError");

// Shared cookie options for the refresh token. httpOnly = JS on the frontend
// can NEVER read this cookie — closes off the most common XSS-steals-token attack.
//
// SameSite is the piece that actually breaks cross-domain deployments: with a
// hardcoded "lax", a cross-site XHR call to POST /api/auth/refresh never
// carries the cookie (Lax only allows it on top-level navigations), so the
// session silently fails to persist the moment frontend and backend are on
// different domains — reproducing exactly as "I logged in, but the next
// action sends me back to login." SameSite=None requires Secure=true (a
// browser requirement, not a choice), so the two are set together here.
const CROSS_SITE = env.crossSiteCookies;
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === "production" || CROSS_SITE,
  sameSite: CROSS_SITE ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/api/auth", // only sent back to auth routes, not every request
};

const signup = asyncHandler(async (req, res) => {
  validateSignup(req.body);
  const { user, accessToken, refreshToken } = await authService.signup(req.body);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, { statusCode: 201, data: { user, accessToken } });
});

const login = asyncHandler(async (req, res) => {
  validateLogin(req.body);
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, { data: { user, accessToken } });
});

const refresh = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.refresh(req.cookies?.refreshToken);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, { data: { user, accessToken } });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user?._id);
  res.clearCookie("refreshToken", { path: "/api/auth" });
  sendSuccess(res, { data: null, message: "Logged out." });
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { user: req.user.toSafeJSON() } });
});

const forgotPassword = asyncHandler(async (req, res) => {
  validateForgotPassword(req.body);
  await authService.forgotPassword({ email: req.body.email, clientUrl: env.clientUrl });
  // Same response regardless of whether the email was found — see auth.service.js comment.
  sendSuccess(res, { data: null, message: "If an account exists for that email, a reset link has been sent." });
});

const resetPassword = asyncHandler(async (req, res) => {
  validateResetPassword(req.body);
  await authService.resetPassword({ token: req.body.token, newPassword: req.body.newPassword });
  sendSuccess(res, { data: null, message: "Password reset. You can now log in with your new password." });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new AppError("Verification token is missing.", 400, "VALIDATION_ERROR");
  const user = await authService.verifyEmail(token);
  sendSuccess(res, { data: { user }, message: "Email verified." });
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const result = await authService.resendVerificationEmail(req.user._id);
  sendSuccess(res, {
    data: result,
    message: result.alreadyVerified ? "Your email is already verified." : "Verification email sent.",
  });
});

module.exports = { signup, login, refresh, logout, me, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail };
