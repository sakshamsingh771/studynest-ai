// Badges are computed on the fly from stats we already track — no separate
// "Badge" collection to keep in sync. If the rules change, this is the only
// file that changes; nothing needs a data migration.
const BADGE_RULES = [
  { id: "first-upload", label: "First Upload", check: (stats) => stats.uploadsCount >= 1 },
  { id: "top-contributor", label: "Top Contributor", check: (stats) => stats.uploadsCount >= 10 },
  { id: "rising-star", label: "Rising Star", check: (stats) => stats.followersCount >= 10 },
  { id: "level-5", label: "Level 5 Scholar", check: (stats) => stats.level >= 5 },
  { id: "streak-7", label: "7 Day Streak", check: (stats, streak) => (streak?.longest ?? 0) >= 7 },
  { id: "streak-30", label: "30 Day Streak", check: (stats, streak) => (streak?.longest ?? 0) >= 30 },
];

function computeBadges(stats, streak = {}) {
  return BADGE_RULES.filter((rule) => rule.check(stats, streak)).map(({ id, label }) => ({ id, label }));
}

module.exports = { computeBadges };
