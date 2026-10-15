const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../users/user.model");
const AppError = require("../../utils/AppError");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../../utils/tokens");
const { sendPasswordResetEmail, sendVerificationEmail } = require("./emailService");
const { recordActivity } = require("../gamification/gamification.service");
const env = require("../../config/env");

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const VERIFY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function issueTokens(user) {
  const accessToken = signAccessToken(user._id.toString(), user.role);
  const refreshToken = signRefreshToken(user._id.toString());
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();
  return { accessToken, refreshToken };
}

async function signup({ name, email, password }) {
  if (!name || name.trim().length < 2) {
    throw new AppError("Name must be at least 2 characters.", 400, "VALIDATION_ERROR");
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new AppError("Enter a valid email address.", 400, "VALIDATION_ERROR");
  }
  if (!password || password.length < 8) {
    throw new AppError("Password must be at least 8 characters.", 400, "VALIDATION_ERROR");
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409, "EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    authProvider: "local",
    role: "student",
  });

  // Send verification email (non-blocking)
  try {
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationTokenHash = hashToken(rawToken);
    user.emailVerificationExpires = new Date(Date.now() + VERIFY_TOKEN_EXPIRY_MS);
    await user.save();
    const verifyUrl = `${env.clientUrl}/verify-email?token=${rawToken}`;
    await sendVerificationEmail({ to: user.email, verifyUrl });
  } catch (err) {
    console.error("[auth] Verification email failed:", err.message);
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  return { user: user.toSafeJSON(), accessToken, refreshToken };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError("Email and password are required.", 400, "VALIDATION_ERROR");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash +refreshTokenHash");
  if (!user || !user.passwordHash) {
    throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }
  if (user.isBanned) {
    throw new AppError("Your account has been suspended. Contact support.", 403, "ACCOUNT_BANNED");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }

  // Record activity for streak
  recordActivity(user._id).catch(() => {});

  const { accessToken, refreshToken } = await issueTokens(user);
  return { user: user.toSafeJSON(), accessToken, refreshToken };
}

async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new AppError("Refresh token missing.", 401, "NO_REFRESH_TOKEN");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token.", 401, "INVALID_REFRESH_TOKEN");
  }

  const user = await User.findById(payload.sub).select("+refreshTokenHash");
  if (!user || user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new AppError("Refresh token invalid or already rotated.", 401, "INVALID_REFRESH_TOKEN");
  }

  const tokens = await issueTokens(user);
  return { user: user.toSafeJSON(), ...tokens };
}

async function logout(userId) {
  if (!userId) return;
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
}

async function forgotPassword({ email, clientUrl }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordResetTokenHash +passwordResetExpires");
  if (!user) return; // silent — don't leak account existence

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetTokenHash = hashToken(rawToken);
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
  await user.save();

  const resetUrl = `${clientUrl || env.clientUrl}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail({ to: user.email, resetUrl });
}

async function resetPassword({ token, newPassword }) {
  if (!token || !newPassword || newPassword.length < 8) {
    throw new AppError("Valid token and password (min 8 chars) required.", 400, "VALIDATION_ERROR");
  }

  const tokenHash = hashToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires +passwordHash");

  if (!user) {
    throw new AppError("Reset link is invalid or has expired.", 400, "INVALID_RESET_TOKEN");
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokenHash = undefined; // force re-login
  await user.save();
}

async function verifyEmail(token) {
  if (!token) throw new AppError("Verification token missing.", 400, "VALIDATION_ERROR");

  const tokenHash = hashToken(token);
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationTokenHash +emailVerificationExpires");

  if (!user) {
    throw new AppError("Verification link is invalid or has expired.", 400, "INVALID_VERIFY_TOKEN");
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  return user.toSafeJSON();
}

async function resendVerificationEmail(userId) {
  const user = await User.findById(userId).select("+emailVerificationTokenHash +emailVerificationExpires");
  if (!user) throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  if (user.isEmailVerified) return { alreadyVerified: true };

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.emailVerificationTokenHash = hashToken(rawToken);
  user.emailVerificationExpires = new Date(Date.now() + VERIFY_TOKEN_EXPIRY_MS);
  await user.save();

  const verifyUrl = `${env.clientUrl}/verify-email?token=${rawToken}`;
  await sendVerificationEmail({ to: user.email, verifyUrl });
  return { alreadyVerified: false };
}

module.exports = {
  signup,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
};