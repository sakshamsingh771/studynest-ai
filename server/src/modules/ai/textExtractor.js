const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "../../../uploads");

// Supported: PDF (text layer) and DOCX. Scanned/image-only PDFs return null —
// no OCR runs, and the note is marked failed instead of pretending it was analysed.
async function extractText(note) {
  const type = note.file.type;
  if (type !== "pdf" && type !== "docx") return null;

  const filePath = path.join(UPLOAD_DIR, note.file.storageKey);
  if (!fs.existsSync(filePath)) return null;
  const buffer = await fs.promises.readFile(filePath);

  if (type === "pdf") {
    const pdfParse = require("pdf-parse"); // lazy-required: keeps boot fast
    const data = await pdfParse(buffer);
    return data.text?.trim() || null;
  }

  const mammoth = require("mammoth");
  const { value } = await mammoth.extractRawText({ buffer });
  return value?.trim() || null;
}

// Splits text into ~chunkSize-word pieces with a little overlap, so a concept
// that spans a chunk boundary doesn't get cut in half and lost to retrieval.
function chunkText(text, chunkSizeWords = 300, overlapWords = 40) {
  const words = text.split(/\s+/);
  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSizeWords, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start = end - overlapWords;
  }

  return chunks.filter((c) => c.trim().length > 0);
}

module.exports = { extractText, chunkText };
