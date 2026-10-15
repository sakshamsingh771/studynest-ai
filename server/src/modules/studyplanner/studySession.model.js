const mongoose = require("mongoose");
const { Schema } = mongoose;

const studySessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    scheduledDate: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 5 },
    focus: { type: String, default: "" }, // what to study this session — AI-suggested or left blank
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

studySessionSchema.index({ user: 1, scheduledDate: 1 });

module.exports = mongoose.model("StudySession", studySessionSchema);
