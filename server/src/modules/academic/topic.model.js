const mongoose = require("mongoose");
const { Schema } = mongoose;

// Learning objectives are embedded — they're small, always read with their topic,
// and never queried independently, so a subdocument array avoids an unnecessary
// extra collection + join for something this lightweight.
const learningObjectiveSchema = new Schema(
  { text: { type: String, required: true, trim: true } },
  { _id: false }
);

const topicSchema = new Schema(
  {
    unit: { type: Schema.Types.ObjectId, ref: "Unit", required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: "AcademicSubject", required: true, index: true }, // denormalized for fast "all topics in a subject" queries
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 1 },
    // Rough relative importance (1-5) used as one input to "recommended next" and
    // exam-mode priority ordering. Not claimed to be exact — just a weighting knob.
    weight: { type: Number, default: 3, min: 1, max: 5 },
    // Optional ordering hint: topics that should ideally be understood first.
    // Used by the recommendation engine as a soft "prerequisite" signal, not an enforced gate.
    prerequisiteOrder: { type: Number, default: 0 },
    learningObjectives: [learningObjectiveSchema],
  },
  { timestamps: true }
);

topicSchema.index({ subject: 1, order: 1 });

module.exports = mongoose.model("Topic", topicSchema);
