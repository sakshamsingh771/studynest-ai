const User = require("../users/user.model");
const Note = require("../notes/note.model");
const AIInteraction = require("../ai/aiInteraction.model");

// Real counts only — this exists specifically so the landing page never has
// to fabricate "12,000+ students" style numbers. Cached in-process for a
// short window since these are homepage-traffic reads, not per-user data.
let cache = null;
let cachedAt = 0;
const CACHE_MS = 5 * 60 * 1000;

async function getPublicStats() {
  if (cache && Date.now() - cachedAt < CACHE_MS) return cache;

  const [totalStudents, totalNotes, totalAIGenerations] = await Promise.all([
    User.countDocuments({ isBanned: false }),
    Note.countDocuments({ status: "published" }),
    AIInteraction.countDocuments({}),
  ]);

  cache = { totalStudents, totalNotes, totalAIGenerations, generatedAt: new Date().toISOString() };
  cachedAt = Date.now();
  return cache;
}

module.exports = { getPublicStats };
