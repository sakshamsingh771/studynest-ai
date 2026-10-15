const User = require("./user.model");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const { computeBadges } = require("../gamification/badges.util");

const getMyProfile = asyncHandler(async (req, res) => {
  const user = req.user.toSafeJSON();
  sendSuccess(res, { data: { user: { ...user, badges: computeBadges(user.stats, user.streak) } } });
});

// Only whitelisted fields are writable here — a user should never be able to
// PATCH their own role or stats.xp directly through this endpoint.
const updateMyProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "bio", "college", "university", "course", "branch", "semester", "avatarUrl", "skills"];
  const updates = {};

  for (const key of allowed) {
    if (req.body[key] === undefined) continue;
    if (key === "name") updates.name = req.body.name;
    else if (key === "avatarUrl") updates["profile.avatarUrl"] = req.body.avatarUrl;
    else if (key === "skills") {
      updates["profile.skills"] = Array.isArray(req.body.skills)
        ? req.body.skills
        : String(req.body.skills).split(",").map((s) => s.trim()).filter(Boolean);
    }
    else updates[`profile.${key}`] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
  const safeUser = user.toSafeJSON();
  sendSuccess(res, { data: { user: { ...safeUser, badges: computeBadges(safeUser.stats, safeUser.streak) } } });
});

module.exports = { getMyProfile, updateMyProfile };
