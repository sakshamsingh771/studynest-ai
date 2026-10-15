const mongoose = require("mongoose");
const { Schema } = mongoose;

// A saved, validated AI review of one note. Reviews are private to the user who
// generated them, so a student can revisit them later without paying for another call.
const documentReviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    note: { type: Schema.Types.ObjectId, ref: "Note", required: true, index: true },
    review: { type: Schema.Types.Mixed, required: true },
    chunksUsed: { type: Number, default: 0 },
    totalChunks: { type: Number, default: 0 },
    model: { type: String, default: "" },
    tokensUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);
documentReviewSchema.index({ user: 1, note: 1, createdAt: -1 });

module.exports = mongoose.model("DocumentReview", documentReviewSchema);
