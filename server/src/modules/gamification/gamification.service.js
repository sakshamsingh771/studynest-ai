const User = require("../users/user.model");

// XP -> level curve: every 100 XP is one level. Simple, predictable, and easy
// for the frontend to render as a progress bar (xp % 100).
const XP_PER_LEVEL = 100;

const XP_REWARDS = {
  UPLOAD_NOTE: 20,
  NOTE_DOWNLOADED: 2,   // credited to the note's author, not the downloader
  NOTE_RATED: 1,        // credited to the note's author
  COMMENT_POSTED: 2,
};

// Centralized so every XP-earning action goes through one place — makes it
// trivial to add a "Daily Login Rewards" or "Referral System" action later
// without touching the modules that award XP today.
async function awardXP(userId, amount) {
  if (!userId || !amount) return;

  const user = await User.findById(userId).select("stats.xp stats.level");
  if (!user) return;

  const newXP = user.stats.xp + amount;
  const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;

  await User.updateOne(
    { _id: userId },
    { $set: { "stats.xp": newXP, "stats.level": newLevel } }
  );
}

// Top N users by XP — public (no auth needed to view who's leading), read-only.
async function getLeaderboard(limit = 20) {
  const users = await User.find({ isBanned: false })
    .select("name profile.avatarUrl profile.college stats.xp stats.level stats.uploadsCount")
    .sort({ "stats.xp": -1 })
    .limit(limit);
  return users;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isConsecutiveDay(prev, current) {
  const prevPlusOne = new Date(prev);
  prevPlusOne.setDate(prevPlusOne.getDate() + 1);
  return isSameDay(prevPlusOne, current);
}

// Called from exactly three places: login, a completed quiz, and viewing a
// note (a reasonable proxy for "revision"). Multiple calls on the same day
// are harmless no-ops — the streak only moves once per calendar day,
// otherwise reading five notes in a row would inflate it to 5 days instantly.
async function recordActivity(userId) {
  if (!userId) return;
  const user = await User.findById(userId).select("streak");
  if (!user) return;

  const today = new Date();
  const { current, longest, lastActiveDate } = user.streak;

  if (lastActiveDate && isSameDay(new Date(lastActiveDate), today)) return; // already counted today

  const newCurrent = lastActiveDate && isConsecutiveDay(new Date(lastActiveDate), today) ? current + 1 : 1;
  const newLongest = Math.max(longest, newCurrent);

  await User.updateOne(
    { _id: userId },
    { $set: { "streak.current": newCurrent, "streak.longest": newLongest, "streak.lastActiveDate": today } }
  );
}

module.exports = { awardXP, XP_REWARDS, getLeaderboard, recordActivity };
