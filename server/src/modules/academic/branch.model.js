const mongoose = require("mongoose");
const { Schema } = mongoose;

// e.g. "Computer Science", "Mechanical" under a given Program.
const branchSchema = new Schema(
  {
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

branchSchema.index({ program: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Branch", branchSchema);
