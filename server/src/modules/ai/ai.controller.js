const aiService = require("./ai.service");
const QuizAttempt = require("./quizAttempt.model");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const AppError = require("../../utils/AppError");

const getStatus = asyncHandler(async (req, res) => {
  const note = await aiService.loadAccessibleNote(req.params.noteId, req.user);
  sendSuccess(res, { data: { aiStatus: note.aiStatus || "pending", reason: note.aiStatusReason || "" } });
});

const summary = asyncHandler(async (req, res) => {
  const output = await aiService.generateSummary({ noteId: req.params.noteId, user: req.user, mode: req.body.mode });
  sendSuccess(res, { data: { summary: output } });
});

const flashcards = asyncHandler(async (req, res) => {
  const output = await aiService.generateFlashcards({ noteId: req.params.noteId, user: req.user, count: req.body.count });
  sendSuccess(res, { data: { flashcards: output } });
});

const quiz = asyncHandler(async (req, res) => {
  const output = await aiService.generateQuiz({
    noteId: req.params.noteId, user: req.user, difficulty: req.body.difficulty, count: req.body.count,
  });
  sendSuccess(res, { data: { questions: output } });
});

const chat = asyncHandler(async (req, res) => {
  const output = await aiService.chatWithNote({ noteId: req.params.noteId, user: req.user, question: req.body.question });
  sendSuccess(res, { data: { answer: output } });
});

const createReview = asyncHandler(async (req, res) => {
  const review = await aiService.reviewNote({ noteId: req.params.noteId, user: req.user });
  sendSuccess(res, { statusCode: 201, data: { review } });
});

const listReviews = asyncHandler(async (req, res) => {
  const reviews = await aiService.listReviews({ noteId: req.params.noteId, user: req.user });
  sendSuccess(res, { data: { reviews } });
});

const deleteReview = asyncHandler(async (req, res) => {
  await aiService.deleteReview({ reviewId: req.params.reviewId, user: req.user });
  sendSuccess(res, { data: {} });
});

const reprocess = asyncHandler(async (req, res) => {
  const note = await aiService.reprocessNote({ noteId: req.params.noteId, user: req.user });
  sendSuccess(res, { statusCode: 202, data: { aiStatus: note.aiStatus } });
});

const submitQuizAttempt = asyncHandler(async (req, res) => {
  await aiService.loadAccessibleNote(req.params.noteId, req.user); // same access rule as generating the quiz
  const { score, total, difficulty, topicId } = req.body;
  if (!Number.isInteger(score) || !Number.isInteger(total) || total <= 0 || score < 0 || score > total) {
    throw new AppError("Invalid quiz attempt data.", 400, "VALIDATION_ERROR");
  }
  const attempt = await QuizAttempt.create({
    user: req.user._id, note: req.params.noteId, score, total, difficulty,
    topic: topicId || null,
  });
  const { recordActivity } = require("../gamification/gamification.service");
  await recordActivity(req.user._id);
  sendSuccess(res, { statusCode: 201, data: { attempt } });
});

module.exports = { getStatus, summary, flashcards, quiz, chat, createReview, listReviews, deleteReview, reprocess, submitQuizAttempt };
