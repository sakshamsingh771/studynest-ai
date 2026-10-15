const mongoose = require("mongoose");
const { Schema } = mongoose;

const noteSchema = new Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true, maxlength: 150 },
    description: { type: String, default: "", maxlength: 1000 },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    file: {
      url: { type: String, required: true },
      storageKey: { type: String, required: true }, // path/key used to delete the file later
      type: { type: String, enum: ["pdf", "ppt", "pptx", "doc", "docx", "image", "zip"], required: true },
      originalName: String,
      sizeBytes: Number,
    },
    thumbnailUrl: { type: String, default: "" },

    meta: {
      subject: { type: String, trim: true, index: true },
      semester: { type: Number, min: 1, max: 12 },
      branch: { type: String, trim: true },
      college: { type: String, trim: true },
      university: { type: String, trim: true },
      language: { type: String, default: "en" },
      tags: [{ type: String, trim: true, lowercase: true, index: true }],
    },

    access: {
      isPremium: { type: Boolean, default: false },
      price: { type: Number, default: 0, min: 0 },
    },

    // Optional link into the syllabus hierarchy. Entirely optional and additive —
    // existing notes with no academicMapping keep working exactly as before
    // everywhere (Explore, marketplace, AI tools); this is only read by the new
    // "My Academic Space" / topic-detail / PYQ-intelligence features to pull in
    // resources for a given topic.
    academicMapping: {
      university: { type: Schema.Types.ObjectId, ref: "University", default: null },
      subject: { type: Schema.Types.ObjectId, ref: "AcademicSubject", default: null, index: true },
      unit: { type: Schema.Types.ObjectId, ref: "Unit", default: null },
      topic: { type: Schema.Types.ObjectId, ref: "Topic", default: null, index: true },
    },

    // Drives whether "Chat with this note" / summary / quiz buttons are enabled on the frontend.
    // "pending" until the background job (ai.processing.js) extracts text and builds embeddings.
    aiStatus: { type: String, enum: ["pending", "processing", "ready", "failed"], default: "pending" },
    // Human-readable reason shown to the student when aiStatus === "failed".
    aiStatusReason: { type: String, default: "", maxlength: 300 },

    engagement: {
      downloads: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      avgRating: { type: Number, default: 0 },
      ratingCount: { type: Number, default: 0 },
    },

    status: { type: String, enum: ["published", "archived", "flagged"], default: "published" },
  },
  { timestamps: true }
);

// Full-text search across title/description, and the common filter combo used by Explore.
noteSchema.index({ title: "text", description: "text" });
noteSchema.index({ "meta.college": 1, "meta.branch": 1, "meta.semester": 1, "meta.subject": 1 });
noteSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Note", noteSchema);
