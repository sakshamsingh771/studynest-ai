const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { verifyAccessToken } = require("../utils/tokens");
const User = require("../modules/users/user.model");

// Verifies the access token from the Authorization header and attaches the
// authenticated user to req.user. Every protected route uses this first.
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Not authenticated. Please log in.", 401, "NO_TOKEN");
  }

  const token = authHeader.split(" ")[1];

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw new AppError("Session expired. Please log in again.", 401, "TOKEN_EXPIRED");
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new AppError("User no longer exists.", 401, "USER_NOT_FOUND");
  }
  if (user.isBanned) {
    throw new AppError("Your account has been suspended. Contact support if you think this is a mistake.", 403, "ACCOUNT_BANNED");
  }

  req.user = user; // downstream controllers use req.user
  next();
});

module.exports = { protect };
