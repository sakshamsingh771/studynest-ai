const mongoose = require("mongoose");
const { Schema } = mongoose;

const subjectSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    examDate: { type: Date, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    targetHours: { type: Number, required: true, min: 1 }, // total hours the student wants to put in before the exam
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
