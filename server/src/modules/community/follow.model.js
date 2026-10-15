const mongoose = require("mongoose");
const { Schema } = mongoose;

const followSchema = new Schema(
  {
    follower: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    following: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });

module.exports = mongoose.model("Follow", followSchema);
