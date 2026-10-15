const jwt = require("jsonwebtoken");
const env = require("../config/env");

// Access token: short-lived, sent in the Authorization header on every request.
function signAccessToken(userId, role) {
  return jwt.sign({ sub: userId, role }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiry,
  });
}

// Refresh token: long-lived, stored ONLY in an httpOnly cookie (never touched by JS).
// This is what lets a user stay logged in without re-entering credentials every 15 minutes.
function signRefreshToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiry,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
