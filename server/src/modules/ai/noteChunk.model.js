const mongoose = require("mongoose");
const { Schema } = mongoose;

// One row per chunk of extracted text from a note's file, plus its embedding.
// This is the retrieval index for RAG chat: instead of stuffing an entire PDF
// into the prompt (expensive, and models degrade over very long contexts),
// we find the ~4 most relevant chunks for a given question and send only those.
const noteChunkSchema = new Schema(
  {
    note: { type: Schema.Types.ObjectId, ref: "Note", required: true, index: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    chunkIndex: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NoteChunk", noteChunkSchema);
