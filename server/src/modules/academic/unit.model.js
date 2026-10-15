const mongoose = require("mongoose");
const { Schema } = mongoose;

const unitSchema = new Schema(
  {
    subject: { type: Schema.Types.ObjectId, ref: "AcademicSubject", required: true, index: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 1 }, // drives "priority unit ordering" for exam mode
  },
  { timestamps: true }
);

unitSchema.index({ subject: 1, order: 1 });

module.exports = mongoose.model("Unit", unitSchema);
