const Comment = require("./comment.model");
const Rating = require("./rating.model");
const Follow = require("./follow.model");
const Bookmark = require("./bookmark.model");
const Note = require("../notes/note.model");
const User = require("../users/user.model");
const AppError = require("../../utils/AppError");
const { awardXP, XP_REWARDS } = require("../gamification/gamification.service");
const { notify } = require("../notifications/notifications.service");

// ---- Comments ----

async function addComment({ noteId, userId, text, parentComment }) {
  const note = await Note.findById(noteId);
  if (!note) throw new AppError("Note not found.", 404, "NOTE_NOT_FOUND");

  const comment = await Comment.create({ note: noteId, user: userId, text, parentComment: parentComment || null });
  await awardXP(userId, XP_REWARDS.COMMENT_POSTED);

  if (note.author.toString() !== userId.toString()) {
    const commenter = await User.findById(userId).select("name");
    await notify({
      recipient: note.author,
      type: "new_comment",
      message: `${commenter.name} commented on your note "${note.title}"`,
      payload: { noteId },
    });
  }

  return comment.populate("user", "name profile.avatarUrl");
}

async function listComments(noteId) {
  // Flat fetch, threaded on the frontend using parentComment — cheaper than a
  // recursive query, and comment trees for a single note are small enough
  // that client-side grouping is instant.
  return Comment.find({ note: noteId }).sort({ createdAt: 1 }).populate("user", "name profile.avatarUrl");
}

async function deleteComment({ commentId, userId, userRole }) {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new AppError("Comment not found.", 404, "COMMENT_NOT_FOUND");

  const isOwner = comment.user.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw new AppError("You can only delete your own comments.", 403, "FORBIDDEN");
  }

  await comment.deleteOne();
}

// ---- Ratings ----

async function rateNote({ noteId, userId, value, reviewText }) {
  const note = await Note.findById(noteId);
  if (!note) throw new AppError("Note not found.", 404, "NOTE_NOT_FOUND");

  const existing = await Rating.findOne({ note: noteId, user: userId });

  if (existing) {
    existing.value = value;
    if (reviewText !== undefined) existing.reviewText = reviewText;
    await existing.save();
  } else {
    await Rating.create({ note: noteId, user: userId, value, reviewText: reviewText || "" });
    await awardXP(note.author, XP_REWARDS.NOTE_RATED);
  }

  // Recompute the note's aggregate rating from the source of truth (Rating docs)
  // rather than incrementing a running average — simpler to reason about, and
  // correct even if someone changes their rating later.
  const agg = await Rating.aggregate([
    { $match: { note: note._id } },
    { $group: { _id: "$note", avg: { $avg: "$value" }, count: { $sum: 1 } } },
  ]);

  const { avg = 0, count = 0 } = agg[0] || {};
  note.engagement.avgRating = Math.round(avg * 10) / 10;
  note.engagement.ratingCount = count;
  await note.save();

  return { avgRating: note.engagement.avgRating, ratingCount: note.engagement.ratingCount };
}

// ---- Follows ----

async function followUser({ followerId, targetUserId }) {
  if (followerId.toString() === targetUserId.toString()) {
    throw new AppError("You can't follow yourself.", 400, "INVALID_FOLLOW");
  }

  const target = await User.findById(targetUserId);
  if (!target) throw new AppError("User not found.", 404, "USER_NOT_FOUND");

  const existing = await Follow.findOne({ follower: followerId, following: targetUserId });
  if (existing) return { following: true }; // idempotent — following twice is a no-op, not an error

  await Follow.create({ follower: followerId, following: targetUserId });
  await User.updateOne({ _id: followerId }, { $inc: { "stats.followingCount": 1 } });
  await User.updateOne({ _id: targetUserId }, { $inc: { "stats.followersCount": 1 } });

  const follower = await User.findById(followerId).select("name");
  await notify({
    recipient: targetUserId,
    type: "new_follower",
    message: `${follower.name} started following you`,
    payload: { userId: followerId },
  });

  return { following: true };
}

async function unfollowUser({ followerId, targetUserId }) {
  const deleted = await Follow.findOneAndDelete({ follower: followerId, following: targetUserId });
  if (!deleted) return { following: false };

  await User.updateOne({ _id: followerId }, { $inc: { "stats.followingCount": -1 } });
  await User.updateOne({ _id: targetUserId }, { $inc: { "stats.followersCount": -1 } });

  return { following: false };
}

// ---- Reviews (a Rating with written text attached) ----

async function listReviews(noteId) {
  return Rating.find({ note: noteId, reviewText: { $ne: "" } })
    .sort({ createdAt: -1 })
    .populate("user", "name profile.avatarUrl");
}

// ---- Bookmarks ----

async function toggleBookmark({ userId, noteId }) {
  const note = await Note.findById(noteId);
  if (!note) throw new AppError("Note not found.", 404, "NOTE_NOT_FOUND");

  const existing = await Bookmark.findOne({ user: userId, note: noteId });
  if (existing) {
    await existing.deleteOne();
    return { bookmarked: false };
  }

  await Bookmark.create({ user: userId, note: noteId });
  return { bookmarked: true };
}

async function listMyBookmarks(userId) {
  const bookmarks = await Bookmark.find({ user: userId }).sort({ createdAt: -1 }).populate({
    path: "note",
    match: { status: "published" }, // skip bookmarks pointing at since-archived notes
    populate: { path: "author", select: "name profile.avatarUrl" },
  });
  return bookmarks.filter((b) => b.note).map((b) => b.note);
}

module.exports = {
  addComment, listComments, deleteComment, rateNote, followUser, unfollowUser,
  listReviews, toggleBookmark, listMyBookmarks,
};
