const mongoose = require("mongoose");
const { Schema } = mongoose;

// A single previous-year question, linked to the syllabus hierarchy so we can
// compute honest frequency/distribution stats per topic (see pyq.service.js).
// We deliberately do NOT store or expose any "this will appear again" prediction —
// only descriptive historical frequency language, per the product spec.
const pyqSchema = new Schema(
  {
    university: { type: Schema.Types.ObjectId, ref: "University", required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: "AcademicSubject", required: true, index: true },
    unit: { type: Schema.Types.ObjectId, ref: "Unit" },
    topic: { type: Schema.Types.ObjectId, ref: "Topic", index: true },
    year: { type: Number, required: true },
    examName: { type: String, trim: true, default: "" }, // e.g. "End Semester", "Mid Sem 1"
    questionText: { type: String, required: true, trim: true, maxlength: 2000 },
    marks: { type: Number, default: 0 },
    type: { type: String, enum: ["mcq", "short", "long", "numerical", "other"], default: "other" },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

pyqSchema.index({ subject: 1, topic: 1, year: -1 });

module.exports = mongoose.model("PYQ", pyqSchema);
