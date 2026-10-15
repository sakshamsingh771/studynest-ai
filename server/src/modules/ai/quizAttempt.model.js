const mongoose = require("mongoose");
const { Schema } = mongoose;

// Persists the result of a completed quiz — QuizTab computes the score
// client-side (immediate feedback), then reports it here so "Quiz Performance"
// on the dashboard has real numbers instead of nothing at all.
const quizAttemptSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    note: { type: Schema.Types.ObjectId, ref: "Note", required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    // Optional: set when the quiz was taken in the context of a syllabus topic
    // (e.g. from the Academic Space topic view). Used by the mastery engine to
    // compute a per-topic Estimated Mastery score. Quizzes taken the "plain" way
    // (from a note's AI tab with no topic context) simply leave this null and
    // are excluded from mastery math, which is correct — we never guess a topic.
    topic: { type: Schema.Types.ObjectId, ref: "Topic", default: null, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
