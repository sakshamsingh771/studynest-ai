const mongoose = require("mongoose");
const { Schema } = mongoose;

// Same shape as Follow — a user saving a note for later. Kept separate from
// the "purchased notes" concept: bookmarking is free and works on any note,
// purchasing is what unlocks a premium note's file.
const bookmarkSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    note: { type: Schema.Types.ObjectId, ref: "Note", required: true },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, note: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
