const Note = require("./note.model");
const User = require("../users/user.model");
const RecentView = require("./recentView.model");
const storageService = require("./storage/storageService");
const AppError = require("../../utils/AppError");
const { resolveNoteType } = require("./notes.upload.middleware");
const { processNoteForAI } = require("../ai/ai.processing");
const { awardXP, XP_REWARDS } = require("../gamification/gamification.service");

async function createNote({ authorId, body, file }) {
  if (!file) {
    throw new AppError("A file is required to upload a note.", 400, "FILE_REQUIRED");
  }

  const { url, storageKey } = await storageService.upload(file.buffer, { originalName: file.originalname });

  let note;
  try {
    note = await Note.create({
      title: body.title,
      description: body.description || "",
      author: authorId,
      file: {
        url,
        storageKey,
        type: resolveNoteType(file.mimetype),
        originalName: file.originalname,
        sizeBytes: file.size,
      },
      meta: {
        subject: body.subject,
        semester: body.semester ? Number(body.semester) : undefined,
        branch: body.branch,
        college: body.college,
        university: body.university,
        tags: body.tags ? String(body.tags).split(",").map((t) => t.trim()).filter(Boolean) : [],
      },
      access: {
        isPremium: body.isPremium === "true" || body.isPremium === true,
        price: body.price ? Number(body.price) : 0,
      },
      // Optional — uploader can tag a note with University/Subject/Unit/Topic so it
      // surfaces in "My Academic Space" and topic-level resource lists. Left blank
      // on existing uploads and on anyone who doesn't use the academic picker.
      academicMapping: {
        university: body.academicUniversity || null,
        subject: body.academicSubject || null,
        unit: body.academicUnit || null,
        topic: body.academicTopic || null,
      },
    });

  } catch (err) {
    // don't leave an orphaned file on disk when the DB write fails
    await storageService.remove(storageKey).catch(() => {});
    throw err;
  }

  _triggerAIProcessing(note);
  await awardXP(authorId, XP_REWARDS.UPLOAD_NOTE);
  await User.updateOne({ _id: authorId }, { $inc: { "stats.uploadsCount": 1 } });

  return note.populate("author", "name profile.avatarUrl profile.college");
}

// Fire-and-forget: don't make the uploader wait for text extraction + embeddings.
// setImmediate defers this to after the current response cycle finishes.
function _triggerAIProcessing(note) {
  setImmediate(() => {
    processNoteForAI(note._id).catch((err) =>
      console.error(`[notes.service] AI processing failed for ${note._id}:`, err.message)
    );
  });
}

// Search + filter + paginate. Every param is optional — an empty query returns
// the most recent published notes, which is what the Explore page shows by default.
async function listNotes(query) {
  const { q, subject, branch, college, semester, tags, priceFilter, page = 1, limit = 20, sort = "-createdAt" } = query;

  const filter = { status: "published" };
  if (q) filter.$text = { $search: q };
  if (subject) filter["meta.subject"] = new RegExp(subject, "i");
  if (branch) filter["meta.branch"] = new RegExp(branch, "i");
  if (college) filter["meta.college"] = new RegExp(college, "i");
  if (semester) filter["meta.semester"] = Number(semester);
  if (tags) filter["meta.tags"] = { $in: String(tags).split(",").map((t) => t.trim().toLowerCase()) };
  if (priceFilter === "free") filter["access.isPremium"] = false;
  if (priceFilter === "premium") filter["access.isPremium"] = true;

  // Friendly sort keys from the frontend, mapped to the actual Mongo sort spec —
  // keeps API params readable ("sort=rating") without leaking schema paths.
  const SORT_MAP = {
    newest: "-createdAt",
    rating: "-engagement.avgRating",
    downloads: "-engagement.downloads",
    views: "-engagement.views",
  };
  const resolvedSort = SORT_MAP[sort] || sort;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const [notes, total] = await Promise.all([
    Note.find(filter)
      .sort(resolvedSort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("author", "name profile.avatarUrl profile.college"),
    Note.countDocuments(filter),
  ]);

  return {
    notes,
    meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
}

// Same subject first, falling back to same branch — a simple, explainable
// relevance signal rather than a similarity model, which would be overkill
// for "you're reading a DAA note, here are other DAA notes."
async function getRelatedNotes(noteId) {
  const note = await Note.findById(noteId).select("meta author");
  if (!note) return [];

  const bySubject = await Note.find({
    _id: { $ne: noteId },
    status: "published",
    "meta.subject": note.meta.subject,
  })
    .sort({ "engagement.avgRating": -1 })
    .limit(4)
    .populate("author", "name");

  if (bySubject.length >= 4) return bySubject;

  const excludeIds = [noteId, ...bySubject.map((n) => n._id)];
  const byBranch = await Note.find({
    _id: { $nin: excludeIds },
    status: "published",
    "meta.branch": note.meta.branch,
  })
    .sort({ "engagement.avgRating": -1 })
    .limit(4 - bySubject.length)
    .populate("author", "name");

  return [...bySubject, ...byBranch];
}

async function getRecentlyViewed(userId, limit = 6) {
  const views = await RecentView.find({ user: userId })
    .sort({ viewedAt: -1 })
    .limit(limit)
    .populate({ path: "note", match: { status: "published" }, populate: { path: "author", select: "name" } });

  return views.filter((v) => v.note).map((v) => v.note);
}

// "Recommended" here means "matches your college/branch/semester" — an
// honest, explainable signal rather than a black-box similarity model, which
// would need far more usage data than a new platform actually has yet.
async function getRecommendedNotes(userId, limit = 8) {
  const user = await User.findById(userId).select("profile");
  const { college, branch, semester } = user.profile || {};

  const filter = { status: "published", author: { $ne: userId } };
  if (college) filter["meta.college"] = college;
  if (branch) filter["meta.branch"] = branch;
  if (semester) filter["meta.semester"] = semester;

  let notes = await Note.find(filter).sort({ "engagement.avgRating": -1 }).limit(limit).populate("author", "name");

  // Narrow filter found too little (e.g. a new user with an unusual profile
  // combo) — fall back to platform-wide trending rather than an empty section.
  if (notes.length < limit) {
    const excludeIds = [userId, ...notes.map((n) => n._id)];
    const fallback = await Note.find({ status: "published", author: { $nin: [userId] }, _id: { $nin: notes.map((n) => n._id) } })
      .sort({ "engagement.downloads": -1 })
      .limit(limit - notes.length)
      .populate("author", "name");
    notes = [...notes, ...fallback];
  }

  return notes;
}

async function getNoteById(id, requestingUserId) {  const note = await Note.findById(id).populate("author", "name profile.avatarUrl profile.college");
  if (!note || note.status === "archived") {
    throw new AppError("Note not found.", 404, "NOTE_NOT_FOUND");
  }
  // Fire-and-forget view increment — doesn't block the response for the reader.
  Note.updateOne({ _id: id }, { $inc: { "engagement.views": 1 } }).catch(() => {});
  if (requestingUserId) {
    RecentView.updateOne(
      { user: requestingUserId, note: id },
      { $set: { viewedAt: new Date() } },
      { upsert: true }
    ).catch(() => {});
    require("../gamification/gamification.service").recordActivity(requestingUserId).catch(() => {});
  }

  // Premium notes: hide the actual file URL from anyone who hasn't paid for it
  // (or isn't the author/an admin). Metadata still shows so it's discoverable
  // and "buyable" — only the download link itself is gated.
  if (note.access.isPremium && note.access.price > 0) {
    const isOwner = requestingUserId && note.author._id.toString() === requestingUserId.toString();
    const purchased = !isOwner && requestingUserId
      ? await require("../marketplace/marketplace.service").hasPurchased(requestingUserId, id)
      : false;

    if (!isOwner && !purchased) {
      const locked = note.toObject();
      locked.file = { ...locked.file, url: null };
      locked.locked = true;
      return locked;
    }
  }

  return note;
}

// Called by the frontend right before it opens the actual file URL — lets us
// credit the author with download stats + XP without gating the download
// itself behind a slow synchronous call.
async function trackDownload(id, requestingUserId) {
  const note = await Note.findById(id);
  if (!note) throw new AppError("Note not found.", 404, "NOTE_NOT_FOUND");

  if (note.access.isPremium && note.access.price > 0) {
    const isOwner = requestingUserId && note.author.toString() === requestingUserId.toString();
    const purchased = !isOwner
      ? await require("../marketplace/marketplace.service").hasPurchased(requestingUserId, id)
      : false;
    if (!isOwner && !purchased) {
      throw new AppError("Purchase this note to download it.", 403, "NOTE_LOCKED");
    }
  }

  await Note.updateOne({ _id: id }, { $inc: { "engagement.downloads": 1 } });
  await awardXP(note.author, XP_REWARDS.NOTE_DOWNLOADED);
  return { fileUrl: note.file.url };
}

async function updateNote({ id, userId, userRole, updates }) {
  const note = await Note.findById(id);
  if (!note) throw new AppError("Note not found.", 404, "NOTE_NOT_FOUND");

  const isOwner = note.author.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw new AppError("You can only edit your own notes.", 403, "FORBIDDEN");
  }

  const allowed = ["title", "description"];
  for (const key of allowed) {
    if (updates[key] !== undefined) note[key] = updates[key];
  }
  if (updates.tags !== undefined) {
    note.meta.tags = String(updates.tags).split(",").map((t) => t.trim()).filter(Boolean);
  }

  await note.save();
  return note;
}

async function deleteNote({ id, userId, userRole }) {
  const note = await Note.findById(id);
  if (!note) throw new AppError("Note not found.", 404, "NOTE_NOT_FOUND");

  const isOwner = note.author.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw new AppError("You can only delete your own notes.", 403, "FORBIDDEN");
  }

  // Soft delete: keep the row (for stats/audit/other people's saved-notes lists that reference it),
  // just hide it everywhere a normal read query filters on status: "published".
  note.status = "archived";
  await note.save();

  // Underlying file is intentionally kept until a real cleanup job runs — soft-deleted
  // notes can still be restored by an admin without re-uploading.
  return note;
}

// Used by the Academic Space / topic-detail view to show resources mapped to one
// syllabus topic (or a whole subject, when no topic is given yet). Read-only,
// separate from listNotes so the general Explore query contract stays untouched.
async function listNotesByAcademicMapping({ subjectId, topicId, limit = 20 }) {
  if (!subjectId && !topicId) return [];
  const filter = { status: "published" };
  if (subjectId) filter["academicMapping.subject"] = subjectId;
  if (topicId) filter["academicMapping.topic"] = topicId;
  return Note.find(filter)
    .sort({ "engagement.avgRating": -1, createdAt: -1 })
    .limit(Math.min(50, Number(limit) || 20))
    .populate("author", "name profile.avatarUrl");
}

async function listMyNotes(userId) {
  return Note.find({ author: userId, status: "published" })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("title file meta createdAt")
    .lean();
}

module.exports = {
  createNote, listNotes, getNoteById, trackDownload, getRelatedNotes, updateNote, deleteNote,
  getRecentlyViewed, getRecommendedNotes, listNotesByAcademicMapping, listMyNotes,
};
