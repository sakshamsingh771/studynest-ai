const Subject = require("./subject.model");
const StudySession = require("./studySession.model");
const AppError = require("../../utils/AppError");
const { awardXP } = require("../gamification/gamification.service");
const aiProvider = require("../ai/aiProvider");
const env = require("../../config/env");

// ---- Subjects ----

async function addSubject({ userId, name, examDate, difficulty, targetHours }) {
  if (!name || !examDate || !targetHours) {
    throw new AppError("Subject name, exam date, and target hours are required.", 400, "VALIDATION_ERROR");
  }
  if (new Date(examDate) < new Date()) {
    throw new AppError("Exam date can't be in the past.", 400, "VALIDATION_ERROR");
  }
  return Subject.create({ user: userId, name, examDate, difficulty, targetHours });
}

async function listSubjects(userId) {
  const subjects = await Subject.find({ user: userId }).sort({ examDate: 1 });

  // Progress is derived from completed session minutes, not stored redundantly
  // on the Subject itself — one source of truth, no risk of the two drifting apart.
  const withProgress = await Promise.all(
    subjects.map(async (s) => {
      const completedAgg = await StudySession.aggregate([
        { $match: { subject: s._id, completed: true } },
        { $group: { _id: null, minutes: { $sum: "$durationMinutes" } } },
      ]);
      const completedHours = Math.round(((completedAgg[0]?.minutes || 0) / 60) * 10) / 10;
      return { ...s.toObject(), completedHours, progressPercent: Math.min(100, Math.round((completedHours / s.targetHours) * 100)) };
    })
  );

  return withProgress;
}

async function deleteSubject({ userId, subjectId }) {
  const subject = await Subject.findOne({ _id: subjectId, user: userId });
  if (!subject) throw new AppError("Subject not found.", 404, "SUBJECT_NOT_FOUND");
  await StudySession.deleteMany({ subject: subjectId, user: userId }); // no orphaned sessions left behind
  await subject.deleteOne();
}

// ---- Sessions ----

async function scheduleSession({ userId, subjectId, scheduledDate, durationMinutes, focus }) {
  const subject = await Subject.findOne({ _id: subjectId, user: userId });
  if (!subject) throw new AppError("Subject not found.", 404, "SUBJECT_NOT_FOUND");

  return StudySession.create({ user: userId, subject: subjectId, scheduledDate, durationMinutes, focus: focus || "" });
}

async function listSessions({ userId, upcoming }) {
  const filter = { user: userId };
  if (upcoming === "true") filter.scheduledDate = { $gte: new Date() };
  return StudySession.find(filter).sort({ scheduledDate: 1 }).populate("subject", "name difficulty examDate");
}

async function completeSession({ userId, sessionId }) {
  const session = await StudySession.findOne({ _id: sessionId, user: userId });
  if (!session) throw new AppError("Session not found.", 404, "SESSION_NOT_FOUND");
  if (session.completed) return session; // idempotent

  session.completed = true;
  session.completedAt = new Date();
  await session.save();

  await awardXP(userId, 5); // small, consistent reward for following through on a planned session
  return session;
}

async function deleteSession({ userId, sessionId }) {
  const session = await StudySession.findOneAndDelete({ _id: sessionId, user: userId });
  if (!session) throw new AppError("Session not found.", 404, "SESSION_NOT_FOUND");
}

// ---- AI-assisted plan generation ----
//
// The SCHEDULE (which dates, how long) is computed deterministically — it's
// arithmetic (days remaining ÷ hours needed), not something that benefits
// from an LLM and would only risk hallucinated dates. The per-session FOCUS
// TOPIC suggestions are where an LLM genuinely helps (breaking "Data
// Structures" into a sensible week-by-week sequence) — that part is optional
// and falls back to a generic label if OPENAI_API_KEY isn't configured,
// exactly like every other AI feature in this app.
async function generateAIPlan({ userId, subjectId }) {
  const subject = await Subject.findOne({ _id: subjectId, user: userId });
  if (!subject) throw new AppError("Subject not found.", 404, "SUBJECT_NOT_FOUND");

  const daysRemaining = Math.max(1, Math.ceil((new Date(subject.examDate) - new Date()) / (1000 * 60 * 60 * 24)));
  const difficultyMultiplier = { easy: 0.8, medium: 1, hard: 1.25 }[subject.difficulty] || 1;
  const totalMinutes = subject.targetHours * 60 * difficultyMultiplier;

  // One session every other day (or daily if the exam is very close), sized
  // to fit the remaining target hours evenly across however many sessions that gives.
  const sessionIntervalDays = daysRemaining <= 7 ? 1 : 2;
  const sessionCount = Math.max(1, Math.floor(daysRemaining / sessionIntervalDays));
  const minutesPerSession = Math.max(20, Math.round(totalMinutes / sessionCount));

  let focusSuggestions = [];
  if (env.openaiApiKey) {
    try {
      const { text } = await aiProvider.chatComplete({
        system: `Break the subject "${subject.name}" into exactly ${sessionCount} short, sequential study focus topics for exam prep, ordered from foundational to advanced. Return ONLY valid JSON: {"topics": ["...", "..."]}. Keep each topic under 8 words.`,
        user: subject.name,
        jsonMode: true,
      });
      focusSuggestions = JSON.parse(text).topics || [];
    } catch {
      focusSuggestions = []; // fall through to generic labels below — never block plan creation on an AI hiccup
    }
  }

  const sessions = [];
  for (let i = 0; i < sessionCount; i++) {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + (i + 1) * sessionIntervalDays);
    sessions.push({
      user: userId,
      subject: subjectId,
      scheduledDate,
      durationMinutes: minutesPerSession,
      focus: focusSuggestions[i] || `${subject.name} — session ${i + 1}`,
    });
  }

  await StudySession.insertMany(sessions);
  return listSessions({ userId, upcoming: "true" });
}

module.exports = {
  addSubject, listSubjects, deleteSubject,
  scheduleSession, listSessions, completeSession, deleteSession,
  generateAIPlan,
};
