const mongoose = require("mongoose");
const { Schema } = mongoose;

// One row per (user, note) pair, upserted on every view — powers "Continue
// Learning" / "Recently Viewed" on the dashboard. Deliberately separate from
// Note.engagement.views (which is a public, anonymous counter): this is
// personal history, only ever read back for the viewing user themselves.
const recentViewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    note: { type: Schema.Types.ObjectId, ref: "Note", required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

recentViewSchema.index({ user: 1, note: 1 }, { unique: true });
recentViewSchema.index({ user: 1, viewedAt: -1 });

module.exports = mongoose.model("RecentView", recentViewSchema);
