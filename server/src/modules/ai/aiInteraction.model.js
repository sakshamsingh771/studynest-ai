const mongoose = require("mongoose");
const { Schema } = mongoose;

// Every AI feature call is logged here. Two jobs:
// 1. Cache — identical (note, type, input) requests return the stored output
//    instead of re-calling the LLM (saves cost + latency).
// 2. History — powers "AI Usage" stats on the student dashboard and admin analytics later.
const aiInteractionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Optional because "ask_course" interactions are scoped to a syllabus topic,
    // not a single note (see modules/academic/academic.service.js askMyCourse).
    note: { type: Schema.Types.ObjectId, ref: "Note", default: null, index: true },
    topic: { type: Schema.Types.ObjectId, ref: "Topic", default: null, index: true },
    type: { type: String, enum: ["summary", "flashcards", "quiz", "chat", "ask_course"], required: true },
    inputKey: { type: String, required: true }, // stable stringified key used for cache lookups
    input: Schema.Types.Mixed,
    output: Schema.Types.Mixed,
    tokensUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

aiInteractionSchema.index({ note: 1, type: 1, inputKey: 1 });

module.exports = mongoose.model("AIInteraction", aiInteractionSchema);
