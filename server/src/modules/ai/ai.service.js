const Note = require("../notes/note.model");
const NoteChunk = require("./noteChunk.model");
const AIInteraction = require("./aiInteraction.model");
const aiProvider = require("./aiProvider");
const AppError = require("../../utils/AppError");
const cosineSimilarity = require("../../utils/cosineSimilarity");
const User = require("../users/user.model");
const { getEffectivePlan } = require("../subscription/subscription.service");
const { FREE_DAILY_AI_LIMITS } = require("../subscription/planConfig");
const DocumentReview = require("./documentReview.model");
const { assertNoteAccess } = require("./aiAccess");
const V = require("./aiValidators");

// Only runs on an actual cache MISS (see withCache below) — reusing an
// already-generated summary/quiz/etc. costs nothing new, so it doesn't count
// against a free user's daily allowance. This keeps the incentive honest:
// the limit is on new AI generations, not on reading content that already exists.
async function assertWithinDailyLimit(userId, type) {
  const user = await User.findById(userId).select("subscription");
  const plan = getEffectivePlan(user);
  if (plan !== "free") return; // Premium/Creator — unlimited

  const limit = FREE_DAILY_AI_LIMITS[type];
  if (!limit) return;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const Model = type === "review" ? DocumentReview : AIInteraction;
  const query = type === "review" ? { user: userId, createdAt: { $gte: startOfToday } } : { user: userId, type, createdAt: { $gte: startOfToday } };
  const usedToday = await Model.countDocuments(query);
  if (usedToday >= limit) {
    throw new AppError(
      `You've reached your daily limit of ${limit} free ${type} generations. Upgrade to Premium for unlimited access.`,
      429,
      "AI_LIMIT_REACHED"
    );
  }
}

async function loadAccessibleNote(noteId, user) {
  const note = await Note.findById(noteId);
  await assertNoteAccess({
    note, user,
    hasPurchased: (uid, nid) => require("../marketplace/marketplace.service").hasPurchased(uid, nid),
  });
  return note;
}

async function assertNoteReady(noteId, user) {
  const note = await loadAccessibleNote(noteId, user);
  if (note.aiStatus === "pending" || note.aiStatus === "processing") {
    throw new AppError("This note is still being processed for AI features. Try again shortly.", 409, "AI_PROCESSING");
  }
  if (note.aiStatus === "failed") {
    throw new AppError(note.aiStatusReason || "AI features aren't available for this note (unsupported file type or no extractable text).", 422, "AI_UNAVAILABLE");
  }
  return note;
}

// Cache wrapper: identical (note, type, inputKey) -> reuse stored output instead of
// paying for another LLM call. See Book 1 §4.3 for why this cache exists.
async function withCache({ userId, noteId, type, input, inputKey, generate }) {
  const existing = await AIInteraction.findOne({ note: noteId, type, inputKey });
  if (existing) return existing.output;

  const { output, tokensUsed } = await generate();
  await AIInteraction.create({ user: userId, note: noteId, type, input, inputKey, output, tokensUsed });
  return output;
}

const SUMMARY_MODE_INSTRUCTIONS = {
  short: "Write a concise summary in 3-5 sentences covering only the most important points.",
  detailed: "Write a thorough, well-organized summary covering all major sections and sub-topics.",
  "exam-prep": "Write a revision-focused summary: key definitions, formulas, and important points to revise, as a bulleted list. Do not claim any of it will appear in an exam.",
  beginner: "Explain the content in simple language, as if teaching someone new to the subject, avoiding jargon.",
};

// Up to MAX_CONTEXT_CHUNKS chunks are sent to the model; the caller learns how
// much of the note that covered so the UI can say so honestly.
const MAX_CONTEXT_CHUNKS = 12;
async function loadContext(noteId) {
  const [chunks, total] = await Promise.all([
    NoteChunk.find({ note: noteId }).sort({ chunkIndex: 1 }).limit(MAX_CONTEXT_CHUNKS).select("text chunkIndex"),
    NoteChunk.countDocuments({ note: noteId }),
  ]);
  if (chunks.length === 0) throw new AppError("No extracted text is available for this note. Try reprocessing it.", 422, "AI_UNAVAILABLE");
  return { text: V.wrapUntrusted(chunks.map((c) => c.text).join("\n\n")), used: chunks.length, total };
}

async function generateSummary({ noteId, user, mode = "short" }) {
  const note = await assertNoteReady(noteId, user);
  const safeMode = SUMMARY_MODE_INSTRUCTIONS[mode] ? mode : "short";
  const instruction = SUMMARY_MODE_INSTRUCTIONS[safeMode];

  return withCache({
    userId: user._id, noteId, type: "summary", input: { mode: safeMode }, inputKey: `mode:${safeMode}`,
    generate: async () => {
      await assertWithinDailyLimit(user._id, "summary");
      const ctx = await loadContext(noteId);
      const { text, tokensUsed } = await aiProvider.chatComplete({
        system: `You are a study assistant summarizing lecture notes titled "${note.title}". ${instruction} Base the summary ONLY on the provided content — do not add outside information. ${V.INJECTION_GUARD}`,
        user: ctx.text,
      });
      if (!text?.trim()) throw new AppError("The AI returned an empty summary. Please try again.", 502, "AI_BAD_OUTPUT");
      return { output: text, tokensUsed };
    },
  });
}

function clampInt(v, min, max, fallback) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

async function generateFlashcards({ noteId, user, count = 10 }) {
  const note = await assertNoteReady(noteId, user);
  const n = clampInt(count, 3, 25, 10);

  return withCache({
    userId: user._id, noteId, type: "flashcards", input: { count: n }, inputKey: `count:${n}`,
    generate: async () => {
      await assertWithinDailyLimit(user._id, "flashcards");
      const ctx = await loadContext(noteId);
      const { text, tokensUsed } = await aiProvider.chatComplete({
        system: `Generate up to ${n} distinct flashcards from the note "${note.title}". Return ONLY valid JSON: {"flashcards":[{"question":"...","answer":"..."}]}. Base them only on the provided content. ${V.INJECTION_GUARD}`,
        user: ctx.text,
        jsonMode: true,
      });
      return { output: V.validateFlashcards(V.parseJsonStrict(text), n), tokensUsed };
    },
  });
}

const DIFFICULTIES = ["easy", "medium", "hard"];

async function generateQuiz({ noteId, user, difficulty = "medium", count = 8 }) {
  const note = await assertNoteReady(noteId, user);
  const diff = DIFFICULTIES.includes(difficulty) ? difficulty : "medium";
  const n = clampInt(count, 3, 20, 8);

  return withCache({
    userId: user._id, noteId, type: "quiz", input: { difficulty: diff, count: n }, inputKey: `diff:${diff}:count:${n}`,
    generate: async () => {
      await assertWithinDailyLimit(user._id, "quiz");
      const ctx = await loadContext(noteId);
      const { text, tokensUsed } = await aiProvider.chatComplete({
        system: `Generate up to ${n} ${diff}-difficulty multiple-choice questions from the note "${note.title}". Each has exactly 4 distinct options and one correct answer. Return ONLY valid JSON: {"questions":[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]}. Base them only on the provided content. ${V.INJECTION_GUARD}`,
        user: ctx.text,
        jsonMode: true,
      });
      return { output: V.validateQuiz(V.parseJsonStrict(text), n), tokensUsed };
    },
  });
}

// The actual RAG step: embed the question, rank all of this note's chunks by
// cosine similarity, take the top few, and force the model to answer using
// ONLY that retrieved context — this is what keeps answers grounded in the
// note instead of the model's general knowledge.
async function chatWithNote({ noteId, user, question }) {
  const note = await assertNoteReady(noteId, user);
  const q = typeof question === "string" ? question.trim() : "";
  if (q.length < 3 || q.length > 500) {
    throw new AppError("Please ask a specific question (3-500 characters).", 400, "VALIDATION_ERROR");
  }

  return withCache({
    userId: user._id, noteId, type: "chat", input: { question: q }, inputKey: `q:${q.toLowerCase()}`,
    generate: async () => {
      await assertWithinDailyLimit(user._id, "chat");
      const questionEmbedding = await aiProvider.embed(q);
      const chunks = await NoteChunk.find({ note: noteId });

      const ranked = chunks
        .map((c) => ({ text: c.text, score: cosineSimilarity(questionEmbedding, c.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      const context = V.wrapUntrusted(ranked.map((c) => c.text).join("\n\n---\n\n"));

      const { text, tokensUsed } = await aiProvider.chatComplete({
        system: `You are answering questions about the note "${note.title}" using ONLY the excerpts in the document tags. If the answer isn't in these excerpts, say you couldn't find it in this note — do not guess or use outside knowledge. ${V.INJECTION_GUARD}`,
        user: `${context}\n\nQuestion: ${q}`,
      });
      return { output: text, tokensUsed };
    },
  });
}

// ---------- Document Review ----------
const REVIEW_SYSTEM = `You review a student's study notes. Return ONLY valid JSON with this shape:
{"overview":"2-4 sentence overview","clarityScore":1-10,
"keyConcepts":[{"text":"concept + one-line explanation"}],
"strengths":[{"text":"...","evidence":"short excerpt from the notes"}],
"weakSections":[{"text":"what is weak","evidence":"short excerpt from the notes"}],
"missingOrUnclear":[{"text":"an explanation that appears missing or unclear","evidence":"excerpt that shows it"}],
"terminologyIssues":[{"text":"...","evidence":"excerpt"}],
"revisionTips":[{"text":"..."}],
"practiceQuestions":[{"text":"practice question based on the notes"}],
"limitations":"what you could NOT assess (e.g. only part of the document was provided)"}
Rules: every weakSections / missingOrUnclear / terminologyIssues item MUST quote evidence from the notes; if you cannot quote evidence, omit the item. Do not invent facts, formulas or page numbers. Practice questions are for practice only — never claim they will appear in an exam. Max 6 items per list.`;

async function reviewNote({ noteId, user }) {
  const note = await assertNoteReady(noteId, user);
  await assertWithinDailyLimit(user._id, "review");
  const ctx = await loadContext(noteId);

  const { text, tokensUsed, model } = await aiProvider.chatComplete({
    system: `${REVIEW_SYSTEM} The note is titled "${note.title}". ${V.INJECTION_GUARD}`,
    user: ctx.text,
    jsonMode: true,
    temperature: 0.2,
  });
  const review = V.validateReview(V.parseJsonStrict(text));
  if (ctx.used < ctx.total) {
    review.limitations = `${review.limitations ? review.limitations + " " : ""}Only the first ${ctx.used} of ${ctx.total} sections of this note were analysed.`.trim();
  }

  return DocumentReview.create({
    user: user._id, note: noteId, review, chunksUsed: ctx.used, totalChunks: ctx.total, model: model || "", tokensUsed,
  });
}

async function listReviews({ noteId, user }) {
  await loadAccessibleNote(noteId, user);
  return DocumentReview.find({ user: user._id, note: noteId }).sort({ createdAt: -1 }).limit(10);
}

async function deleteReview({ reviewId, user }) {
  const r = await DocumentReview.findOne({ _id: reviewId, user: user._id }); // ownership enforced in the query
  if (!r) throw new AppError("Review not found.", 404, "REVIEW_NOT_FOUND");
  await r.deleteOne();
}

// Owner-only retry for notes whose processing failed or never ran.
async function reprocessNote({ noteId, user }) {
  const note = await Note.findById(noteId);
  if (!note || note.author.toString() !== user._id.toString()) throw new AppError("Note not found.", 404, "NOTE_NOT_FOUND");
  if (note.aiStatus === "processing") throw new AppError("This note is already being processed.", 409, "AI_PROCESSING");
  note.aiStatus = "pending";
  note.aiStatusReason = "";
  await note.save();
  require("./ai.processing").processNoteForAI(note._id).catch(() => {});
  return note;
}

module.exports = {
  generateSummary, generateFlashcards, generateQuiz, chatWithNote, reviewNote, listReviews, deleteReview,
  reprocessNote, loadAccessibleNote, assertWithinDailyLimit,
};
