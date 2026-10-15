const asyncHandler = require("../utils/asyncHandler");
const { verifyAccessToken } = require("../utils/tokens");
const User = require("../modules/users/user.model");

// Like `protect`, but never throws — used on routes that are public but behave
// differently for a logged-in user (e.g. "is this premium note unlocked for me?").
// If the token is missing/invalid, req.user is simply left undefined.
const softAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

  try {
    const payload = verifyAccessToken(authHeader.split(" ")[1]);
    const user = await User.findById(payload.sub);
    if (user) req.user = user;
  } catch {
    // invalid/expired token on a public route — just proceed as a guest
  }
  next();
});

module.exports = { softAuth };
