const notesService = require("../notes/notes.service");
const Bookmark = require("../community/bookmark.model");
const QuizAttempt = require("../ai/quizAttempt.model");
const Purchase = require("../marketplace/purchase.model");
const Wallet = require("../marketplace/wallet.model");
const Transaction = require("../marketplace/transaction.model");
const subscriptionService = require("../subscription/subscription.service");
const StudySession = require("../studyplanner/studySession.model");
const { computeBadges } = require("../gamification/badges.util");
const User = require("../users/user.model");

// Everything the Dashboard page needs, in one round trip — avoids the page
// firing off six separate loading spinners for what's conceptually one screen.
async function getOverview(userId) {
  const [
    user, recentlyViewed, recommended, savedCount, quizAgg, purchasedCount,
    subscriptionStatus, wallet, recentTransactions, upcomingSessions,
  ] = await Promise.all([
    User.findById(userId).select("stats subscription streak"),
    notesService.getRecentlyViewed(userId, 6),
    notesService.getRecommendedNotes(userId, 8),
    Bookmark.countDocuments({ user: userId }),
    QuizAttempt.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, attempts: { $sum: 1 }, totalScore: { $sum: "$score" }, totalPossible: { $sum: "$total" } } },
    ]),
    Purchase.countDocuments({ buyer: userId, status: "paid" }),
    subscriptionService.getMyStatus(userId),
    Wallet.findOne({ user: userId }),
    Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(5),
    StudySession.find({ user: userId, completed: false, scheduledDate: { $gte: new Date() } })
      .sort({ scheduledDate: 1 })
      .limit(5)
      .populate("subject", "name examDate"),
  ]);

  const quiz = quizAgg[0];
  const quizPerformance = quiz
    ? { attempts: quiz.attempts, avgScorePercent: Math.round((quiz.totalScore / quiz.totalPossible) * 100) }
    : { attempts: 0, avgScorePercent: null };

  return {
    stats: user.stats,
    streak: user.streak,
    badges: computeBadges(user.stats, user.streak),
    recentlyViewed,
    recommended,
    savedCount,
    notesPurchasedCount: purchasedCount,
    quizPerformance,
    subscription: subscriptionStatus,
    walletBalance: wallet?.balance ?? 0,
    recentTransactions,
    upcomingSessions,
  };
}

module.exports = { getOverview };
