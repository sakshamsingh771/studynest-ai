const AppError = require("../../utils/AppError");

// Small hand-rolled validators — no extra dependency needed for a shape this simple.
// (For the AI module later, where inputs get more complex, we'll bring in Zod.)
function validateSignup(body) {
  const { name, email, password } = body;
  if (!name || name.trim().length < 2) {
    throw new AppError("Name must be at least 2 characters.", 400, "VALIDATION_ERROR");
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new AppError("Enter a valid email address.", 400, "VALIDATION_ERROR");
  }
  if (!password || password.length < 8) {
    throw new AppError("Password must be at least 8 characters.", 400, "VALIDATION_ERROR");
  }
}

function validateLogin(body) {
  const { email, password } = body;
  if (!email || !password) {
    throw new AppError("Email and password are required.", 400, "VALIDATION_ERROR");
  }
}

function validateForgotPassword(body) {
  if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
    throw new AppError("Enter a valid email address.", 400, "VALIDATION_ERROR");
  }
}

function validateResetPassword(body) {
  if (!body.token) {
    throw new AppError("Reset token is missing.", 400, "VALIDATION_ERROR");
  }
  if (!body.newPassword || body.newPassword.length < 8) {
    throw new AppError("Password must be at least 8 characters.", 400, "VALIDATION_ERROR");
  }
}

module.exports = { validateSignup, validateLogin, validateForgotPassword, validateResetPassword };
