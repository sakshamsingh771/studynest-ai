const Note = require("../notes/note.model");
const NoteChunk = require("./noteChunk.model");
const aiProvider = require("./aiProvider");
const { extractText, chunkText } = require("./textExtractor");
const env = require("../../config/env");

async function fail(note, reason) {
  note.aiStatus = "failed";
  note.aiStatusReason = reason;
  await note.save();
}

// Runs in the background right after upload (see notes.service.createNote).
// Safe to re-run: old chunks are replaced, never duplicated.
async function processNoteForAI(noteId) {
  const note = await Note.findById(noteId);
  if (!note) return;

  if (!env.openaiApiKey) return fail(note, "AI provider is not configured (OPENAI_API_KEY missing).");

  try {
    note.aiStatus = "processing";
    note.aiStatusReason = "";
    await note.save();

    const text = await extractText(note);
    if (!text) {
      return fail(note, ["pdf", "docx"].includes(note.file.type)
        ? "No extractable text found (the file may be scanned or image-only; OCR is not enabled)."
        : `Text extraction is not supported for ${note.file.type} files yet (supported: PDF, DOCX).`);
    }

    const chunks = chunkText(text);
    const embeddings = await aiProvider.embedMany(chunks);
    const docs = chunks.map((t, i) => ({ note: note._id, text: t, embedding: embeddings[i], chunkIndex: i }));

    // Replace-then-insert so a retry or reprocess never leaves duplicate chunks.
    await NoteChunk.deleteMany({ note: note._id });
    await NoteChunk.insertMany(docs);

    note.aiStatus = "ready";
    await note.save();
  } catch (err) {
    console.error(`[ai.processing] failed for note ${noteId}:`, err.message);
    await fail(note, err.code === "AI_PROVIDER_QUOTA" ? "AI provider quota/rate limit hit. Reprocess later." : "Processing failed. You can retry.");
  }
}

module.exports = { processNoteForAI };
