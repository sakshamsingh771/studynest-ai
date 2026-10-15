const communityService = require("./community.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const AppError = require("../../utils/AppError");

const addComment = asyncHandler(async (req, res) => {
  const { text, parentComment } = req.body;
  if (!text || text.trim().length < 1) {
    throw new AppError("Comment can't be empty.", 400, "VALIDATION_ERROR");
  }
  const comment = await communityService.addComment({
    noteId: req.params.noteId, userId: req.user._id, text, parentComment,
  });
  sendSuccess(res, { statusCode: 201, data: { comment } });
});

const listComments = asyncHandler(async (req, res) => {
  const comments = await communityService.listComments(req.params.noteId);
  sendSuccess(res, { data: { comments } });
});

const deleteComment = asyncHandler(async (req, res) => {
  await communityService.deleteComment({
    commentId: req.params.commentId, userId: req.user._id, userRole: req.user.role,
  });
  sendSuccess(res, { data: null, message: "Comment deleted." });
});

const rateNote = asyncHandler(async (req, res) => {
  const { value, reviewText } = req.body;
  if (!value || value < 1 || value > 5) {
    throw new AppError("Rating must be between 1 and 5.", 400, "VALIDATION_ERROR");
  }
  const result = await communityService.rateNote({ noteId: req.params.noteId, userId: req.user._id, value, reviewText });
  sendSuccess(res, { data: result });
});

const listReviews = asyncHandler(async (req, res) => {
  const reviews = await communityService.listReviews(req.params.noteId);
  sendSuccess(res, { data: { reviews } });
});

const toggleBookmark = asyncHandler(async (req, res) => {
  const result = await communityService.toggleBookmark({ userId: req.user._id, noteId: req.params.noteId });
  sendSuccess(res, { data: result });
});

const listMyBookmarks = asyncHandler(async (req, res) => {
  const notes = await communityService.listMyBookmarks(req.user._id);
  sendSuccess(res, { data: { notes } });
});

const followUser = asyncHandler(async (req, res) => {
  const result = await communityService.followUser({ followerId: req.user._id, targetUserId: req.params.userId });
  sendSuccess(res, { data: result });
});

const unfollowUser = asyncHandler(async (req, res) => {
  const result = await communityService.unfollowUser({ followerId: req.user._id, targetUserId: req.params.userId });
  sendSuccess(res, { data: result });
});

module.exports = {
  addComment, listComments, deleteComment, rateNote, followUser, unfollowUser,
  listReviews, toggleBookmark, listMyBookmarks,
};
