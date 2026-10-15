const mongoose = require("mongoose");
const { Schema } = mongoose;

// A "Degree" in the spec's language, e.g. B.Tech, BCA, B.Sc — scoped to one university
// so the same degree name can exist independently under different universities.
const programSchema = new Schema(
  {
    university: { type: Schema.Types.ObjectId, ref: "University", required: true, index: true },
    name: { type: String, required: true, trim: true }, // e.g. "B.Tech"
    durationYears: { type: Number, default: 4, min: 1, max: 6 },
    totalSemesters: { type: Number, default: 8, min: 1, max: 12 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

programSchema.index({ university: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Program", programSchema);
