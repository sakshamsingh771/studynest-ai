const mongoose = require("mongoose");
const { Schema } = mongoose;

const ratingSchema = new Schema(
  {
    note: { type: Schema.Types.ObjectId, ref: "Note", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    value: { type: Number, required: true, min: 1, max: 5 },
    // Optional written review alongside the star rating — Amazon-style combined
    // action rather than a separate "Review" model, since a review without a
    // rating (or vice versa) isn't a pattern the product actually needs.
    reviewText: { type: String, default: "", maxlength: 500, trim: true },
  },
  { timestamps: true }
);

// One rating per user per note — re-rating updates the existing document (see service).
ratingSchema.index({ note: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
