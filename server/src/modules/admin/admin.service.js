const User = require("../users/user.model");
const Note = require("../notes/note.model");
const Purchase = require("../marketplace/purchase.model");
const WithdrawalRequest = require("../marketplace/withdrawalRequest.model");
const AIInteraction = require("../ai/aiInteraction.model");
const Wallet = require("../marketplace/wallet.model");
const AppError = require("../../utils/AppError");
const { notify } = require("../notifications/notifications.service");

async function getOverview() {
  const [
    totalUsers, totalNotes, flaggedNotes, totalAIInteractions, pendingWithdrawals, revenueAgg,
  ] = await Promise.all([
    User.countDocuments(),
    Note.countDocuments({ status: { $ne: "archived" } }),
    Note.countDocuments({ status: "flagged" }),
    AIInteraction.countDocuments(),
    WithdrawalRequest.countDocuments({ status: "pending" }),
    Purchase.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);

  const downloadsAgg = await Note.aggregate([
    { $group: { _id: null, total: { $sum: "$engagement.downloads" } } },
  ]);

  return {
    totalUsers,
    totalNotes,
    flaggedNotes,
    totalAIInteractions,
    pendingWithdrawals,
    totalRevenue: revenueAgg[0]?.total || 0,
    totalSales: revenueAgg[0]?.count || 0,
    totalDownloads: downloadsAgg[0]?.total || 0,
  };
}

async function listUsers({ search, page = 1, limit = 20 }) {
  const filter = search
    ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] }
    : {};

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    User.countDocuments(filter),
  ]);

  return { users: users.map((u) => u.toSafeJSON()), meta: { page: pageNum, limit: limitNum, total } };
}

async function updateUser(userId, updates) {
  const allowed = ["role", "isBanned"];
  const patch = {};
  for (const key of allowed) if (updates[key] !== undefined) patch[key] = updates[key];

  const user = await User.findByIdAndUpdate(userId, { $set: patch }, { new: true });
  if (!user) throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  return user.toSafeJSON();
}

async function listNotesForModeration({ status = "flagged", page = 1, limit = 20 }) {
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const filter = status === "all" ? {} : { status };

  const [notes, total] = await Promise.all([
    Note.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).populate("author", "name email"),
    Note.countDocuments(filter),
  ]);

  return { notes, meta: { page: pageNum, limit: limitNum, total } };
}

async function moderateNote(noteId, status) {
  if (!["published", "archived", "flagged"].includes(status)) {
    throw new AppError("Invalid moderation status.", 400, "VALIDATION_ERROR");
  }
  const note = await Note.findByIdAndUpdate(noteId, { $set: { status } }, { new: true });
  if (!note) throw new AppError("Note not found.", 404, "NOTE_NOT_FOUND");
  return note;
}

async function listWithdrawals({ status = "pending" }) {
  const filter = status === "all" ? {} : { status };
  return WithdrawalRequest.find(filter).sort({ createdAt: -1 }).populate("user", "name email");
}

async function resolveWithdrawal(requestId, { approve, adminNote = "" }) {
  const request = await WithdrawalRequest.findById(requestId);
  if (!request) throw new AppError("Withdrawal request not found.", 404, "REQUEST_NOT_FOUND");
  if (request.status !== "pending") {
    throw new AppError("This request has already been resolved.", 409, "ALREADY_RESOLVED");
  }

  request.status = approve ? "approved" : "rejected";
  request.adminNote = adminNote;
  await request.save();

  if (!approve) {
    // Rejected — return the reserved amount to the user's wallet.
    await Wallet.updateOne({ user: request.user }, { $inc: { balance: request.amount } });
  }

  await notify({
    recipient: request.user,
    type: approve ? "withdrawal_approved" : "withdrawal_rejected",
    message: approve
      ? `Your withdrawal of ₹${request.amount} was approved and sent.`
      : `Your withdrawal of ₹${request.amount} was rejected. Funds have been returned to your wallet.`,
    payload: { requestId: request._id },
  });

  return request;
}

module.exports = {
  getOverview, listUsers, updateUser, listNotesForModeration, moderateNote, listWithdrawals, resolveWithdrawal,
};
