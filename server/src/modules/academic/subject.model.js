const mongoose = require("mongoose");
const { Schema } = mongoose;

// A Subject is scoped to Branch + Semester, e.g. "Data Structures" in
// Branch=CSE, Semester=3. This is the level most of the app's academic
// features (mastery, PYQ intelligence, recommended-next) are organized around.
const subjectSchema = new Schema(
  {
    branch: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    semester: { type: Number, required: true, min: 1, max: 12 },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, default: "" },
    credits: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subjectSchema.index({ branch: 1, semester: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("AcademicSubject", subjectSchema);
