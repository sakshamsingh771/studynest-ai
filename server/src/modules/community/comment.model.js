const mongoose = require("mongoose");
const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    note: { type: Schema.Types.ObjectId, ref: "Note", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    // Self-reference for one level of threading (a reply to a comment).
    // We deliberately don't support nested-replies-to-replies — keeps the UI and
    // query simple, and covers the vast majority of real discussion-thread needs.
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    likesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

commentSchema.index({ note: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", commentSchema);
