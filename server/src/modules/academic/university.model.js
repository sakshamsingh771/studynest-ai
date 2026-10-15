const mongoose = require("mongoose");
const { Schema } = mongoose;

// Top of the syllabus hierarchy: University -> Program -> Branch -> Subject -> Unit -> Topic.
// Nothing about any specific university is hardcoded anywhere in the app — every
// dropdown and every piece of syllabus content is driven by documents in these
// collections, so adding a new university is a data-entry operation, not a code change.
const universitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, trim: true, uppercase: true, default: "" },
    city: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("University", universitySchema);
