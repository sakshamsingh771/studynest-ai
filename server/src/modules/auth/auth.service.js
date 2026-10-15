const mongoose = require("mongoose");
const University = require("./university.model");
const Program = require("./program.model");
const Branch = require("./branch.model");
const Subject = require("./subject.model");
const Unit = require("./unit.model");
const Topic = require("./topic.model");
const PYQ = require("./pyq.model");
const User = require("../users/user.model");
const Note = require("../notes/note.model");
const NoteChunk = require("../ai/noteChunk.model");
const AIInteraction = require("../ai/aiInteraction.model");
const QuizAttempt = require("../ai/quizAttempt.model");
const aiProvider = require("../ai/aiProvider");
const { assertWithinDailyLimit } = require("../ai/ai.service");
const cosineSimilarity = require("../../utils/cosineSimilarity");
const AppError = require("../../utils/AppError");

/* ------------------------------------------------------------------ *
 * Hierarchy CRUD + cascading lookups                                  *
 * University -> Program -> Branch -> Subject -> Unit -> Topic         *
 * Create endpoints are teacher/admin-only (see academic.routes.js).   *
 * Nothing here hardcodes a specific university — this is pure CRUD    *
 * over real collections, so adding "XYZ University" is a data-entry   *
 * operation done through these same endpoints.                        *
 * ------------------------------------------------------------------ */

async function createUniversity({ name, code, city, userId }) {
  return University.create({ name, code, city, createdBy: userId });
}
async function listUniversities() {
  return University.find({ isActive: true }).sort({ name: 1 });
}

async function createProgram({ university, name, durationYears, totalSemesters }) {
  if (!university) throw new AppError("University is required.", 400, "VALIDATION_ERROR");
  return Program.create({ university, name, durationYears, totalSemesters });
}
async function listProgramsByUniversity(universityId) {
  if (!universityId) return [];
  return Program.find({ university: universityId, isActive: true }).sort({ name: 1 });
}

async function createBranch({ program, name, code }) {
  if (!program) throw new AppError("Program is required.", 400, "VALIDATION_ERROR");
  return Branch.create({ program, name, code });
}
async function listBranchesByProgram(programId) {
  if (!programId) return [];
  return Branch.find({ program: programId, isActive: true }).sort({ name: 1 });
}

async function createSubject({ branch, semester, name, code, credits }) {
  if (!branch || !semester) throw new AppError("Branch and semester are required.", 400, "VALIDATION_ERROR");
  return Subject.create({ branch, semester, name, code, credits });
}
async function listSubjectsByBranchSemester({ branchId, semester }) {
  if (!branchId || !semester) return [];
  return Subject.find({ branch: branchId, semester: Number(semester), isActive: true }).sort({ name: 1 });
}

async function createUnit({ subject, name, order }) {
  if (!subject) throw new AppError("Subject is required.", 400, "VALIDATION_ERROR");
  return Unit.create({ subject, name, order });
}
async function listUnitsBySubject(subjectId) {
  if (!subjectId) return [];
  return Unit.find({ subject: subjectId }).sort({ order: 1, name: 1 });
}

async function createTopic({ unit, subject, name, order, weight, prerequisiteOrder, learningObjectives }) {
  if (!unit || !subject) throw new AppError("Unit and subject are required.", 400, "VALIDATION_ERROR");
  return Topic.create({ unit, subject, name, order, weight, prerequisiteOrder, learningObjectives });
}
async function listTopicsByUnit(unitId) {
  if (!unitId) return [];
  return Topic.find({ unit: unitId }).sort({ order: 1, name: 1 });
}
async function listTopicsBySubject(subjectId) {
  if (!subjectId) return [];
  return Topic.find({ subject: subjectId }).sort({ order: 1, name: 1 });
}
async function getTopicById(topicId) {
  const topic = await Topic.findById(topicId).populate("unit", "name order").populate("subject", "name");
  if (!topic) throw new AppError("Topic not found.", 404, "TOPIC_NOT_FOUND");
  return topic;
}

async function createPYQ(payload) {
  const { university, subject, unit, topic, year, examName, questionText, marks, type, addedBy } = payload;
  if (!university || !subject || !year || !questionText) {
    throw new AppError("University, subject, year, and question text are required.", 400, "VALIDATION_ERROR");
  }
  return PYQ.create({ university, subject, unit, topic, year, examName, questionText, marks, type, addedBy });
}

/* ------------------------------------------------------------------ *
 * Academic profile (on User.academic)                                 *
 * ------------------------------------------------------------------ */

// Real server-side validation of the academic selection — a missing or
// malformed id gets a clear 400 with a specific message (never a raw Mongoose
// CastError leaking as a 500), and each level is checked to actually exist AND
// to belong to the level above it, so a client can't submit a syntactically
// valid ObjectId for the wrong university/program and silently get a
// self-contradictory profile saved.
async function _validateAcademicSelection({ university, program, branch }) {
  if (university) {
    if (!mongoose.Types.ObjectId.isValid(university)) {
      throw new AppError("Select a valid university from the list.", 400, "VALIDATION_ERROR");
    }
    const uniDoc = await University.findById(university);
    if (!uniDoc) throw new AppError("That university could not be found. Please pick one from the list.", 400, "VALIDATION_ERROR");
  }

  if (program) {
    if (!mongoose.Types.ObjectId.isValid(program)) {
      throw new AppError("Select a valid program from the list.", 400, "VALIDATION_ERROR");
    }
    const programDoc = await Program.findById(program);
    if (!programDoc) throw new AppError("That program could not be found. Please pick one from the list.", 400, "VALIDATION_ERROR");
    if (university && String(programDoc.university) !== String(university)) {
      throw new AppError("That program doesn't belong to the selected university.", 400, "VALIDATION_ERROR");
    }
  }

  if (branch) {
    if (!mongoose.Types.ObjectId.isValid(branch)) {
      throw new AppError("Select a valid branch from the list.", 400, "VALIDATION_ERROR");
    }
    const branchDoc = await Branch.findById(branch);
    if (!branchDoc) throw new AppError("That branch could not be found. Please pick one from the list.", 400, "VALIDATION_ERROR");
    if (program && String(branchDoc.program) !== String(program)) {
      throw new AppError("That branch doesn't belong to the selected program.", 400, "VALIDATION_ERROR");
    }
  }
}

async function setMyAcademicProfile(userId, { university, program, branch, semester, academicYear }) {
  await _validateAcademicSelection({ university, program, branch });

  if (semester !== undefined && semester !== null && semester !== "") {
    const sem = Number(semester);
    if (!Number.isInteger(sem) || sem < 1 || sem > 12) {
      throw new AppError("Semester must be a number between 1 and 12.", 400, "VALIDATION_ERROR");
    }
  }

  const updates = {};
  if (university !== undefined) updates["academic.university"] = university || null;
  if (program !== undefined) updates["academic.program"] = program || null;
  if (branch !== undefined) updates["academic.branch"] = branch || null;
  if (semester !== undefined) updates["academic.semester"] = semester ? Number(semester) : null;
  if (academicYear !== undefined) updates["academic.academicYear"] = academicYear || "";

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true })
    .populate("academic.university", "name")
    .populate("academic.program", "name")
    .populate("academic.branch", "name");
  return user;
}

async function getMyAcademicProfile(userId) {
  const user = await User.findById(userId)
    .select("academic")
    .populate("academic.university", "name city")
    .populate("academic.program", "name totalSemesters")
    .populate("academic.branch", "name");
  return user?.academic || null;
}

/* ------------------------------------------------------------------ *
 * PYQ Intelligence — honest, descriptive frequency language only.     *
 * We never claim a question "will" reappear — only how often it (or   *
 * ones like it, grouped by topic) has shown up historically.          *
 * ------------------------------------------------------------------ */

function frequencyLabel(distinctYearCount) {
  if (distinctYearCount >= 3) return "Frequently asked historically";
  if (distinctYearCount === 2) return "Asked more than once historically";
  if (distinctYearCount === 1) return "Appeared once historically";
  return "No recorded PYQs yet";
}

async function getPYQIntelligenceForSubject(subjectId) {
  const [pyqs, topics] = await Promise.all([
    PYQ.find({ subject: subjectId }).sort({ year: -1 }),
    Topic.find({ subject: subjectId }).select("name order"),
  ]);

  const byTopic = new Map();
  for (const t of topics) byTopic.set(String(t._id), { topicId: t._id, topicName: t.name, years: new Set(), count: 0, questions: [] });
  // Bucket for PYQs not yet tagged to a specific topic (still useful, just less precise).
  byTopic.set("untagged", { topicId: null, topicName: "Not yet mapped to a topic", years: new Set(), count: 0, questions: [] });

  for (const q of pyqs) {
    const key = q.topic ? String(q.topic) : "untagged";
    if (!byTopic.has(key)) byTopic.set(key, { topicId: q.topic, topicName: "Unknown topic", years: new Set(), count: 0, questions: [] });
    const bucket = byTopic.get(key);
    bucket.years.add(q.year);
    bucket.count += 1;
    if (bucket.questions.length < 5) bucket.questions.push({ year: q.year, examName: q.examName, questionText: q.questionText, marks: q.marks });
  }

  const distribution = Array.from(byTopic.values())
    .filter((b) => b.count > 0 || b.topicId)
    .map((b) => ({
      topicId: b.topicId,
      topicName: b.topicName,
      totalQuestions: b.count,
      distinctYears: b.years.size,
      yearsSeen: Array.from(b.years).sort((a, b2) => b2 - a),
      frequencyLabel: frequencyLabel(b.years.size),
      sampleQuestions: b.questions,
    }))
    .sort((a, b) => b.totalQuestions - a.totalQuestions);

  return {
    totalPYQs: pyqs.length,
    yearsCovered: Array.from(new Set(pyqs.map((q) => q.year))).sort((a, b) => b - a),
    distribution,
    disclaimer:
      "These statistics describe how often similar questions have appeared in past years. They are historical patterns, not predictions — they do not guarantee any question will or will not appear in a future exam.",
  };
}

/* ------------------------------------------------------------------ *
 * Estimated Mastery engine                                            *
 * Inputs: quiz accuracy (topic-tagged QuizAttempts), attempt count     *
 * (more practice -> slightly more confidence in the score), and        *
 * recency (older attempts count for less). Explicitly NOT claimed to  *
 * be a scientifically validated measurement — just a transparent,     *
 * explainable estimate from the student's own activity.                *
 * ------------------------------------------------------------------ */

function masteryState(score) {
  if (score >= 81) return "Strong";
  if (score >= 61) return "Good";
  if (score >= 31) return "Developing";
  return "Needs Attention";
}

async function computeTopicMastery(userId, topicId) {
  const attempts = await QuizAttempt.find({ user: userId, topic: topicId }).sort({ createdAt: -1 }).limit(20);

  if (attempts.length === 0) {
    return { topicId, score: null, state: "Not Started", attemptCount: 0, label: "No quiz attempts yet for this topic." };
  }

  const now = Date.now();
  let weightedScoreSum = 0;
  let weightTotal = 0;

  attempts.forEach((a, idx) => {
    const accuracy = a.total > 0 ? a.score / a.total : 0;
    const daysAgo = (now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    // Recency decay: an attempt from ~30 days ago carries about half the weight
    // of one taken today. Floor at 0.2 so very old attempts still count a little.
    const recencyWeight = Math.max(0.2, 1 / (1 + daysAgo / 30));
    weightedScoreSum += accuracy * recencyWeight;
    weightTotal += recencyWeight;
  });

  const accuracyComponent = weightTotal > 0 ? weightedScoreSum / weightTotal : 0; // 0..1
  // Practice bonus: a small, capped boost for having attempted the topic more than
  // once — reflects more confidence in the estimate, not "more correct answers."
  const practiceBonus = Math.min(10, (attempts.length - 1) * 2);

  const score = Math.max(0, Math.min(100, Math.round(accuracyComponent * 90 + practiceBonus)));

  return {
    topicId,
    score,
    state: masteryState(score),
    attemptCount: attempts.length,
    lastAttemptAt: attempts[0].createdAt,
    label: `Estimated Mastery — based on ${attempts.length} quiz attempt${attempts.length === 1 ? "" : "s"} on this topic.`,
  };
}

async function computeSubjectMastery(userId, subjectId) {
  const topics = await Topic.find({ subject: subjectId }).sort({ order: 1 });
  const masteries = await Promise.all(topics.map((t) => computeTopicMastery(userId, t._id)));

  const withScores = masteries.filter((m) => m.score !== null);
  const overallPrepPercent = withScores.length
    ? Math.round(withScores.reduce((sum, m) => sum + m.score, 0) / topics.length) // topics never attempted count as 0 toward overall prep
    : 0;

  const weakTopics = topics
    .map((t, i) => ({ topic: t, mastery: masteries[i] }))
    .filter(({ mastery }) => mastery.score === null || mastery.score <= 60)
    .sort((a, b) => (a.mastery.score ?? -1) - (b.mastery.score ?? -1))
    .slice(0, 5)
    .map(({ topic, mastery }) => ({ topicId: topic._id, topicName: topic.name, ...mastery }));

  const strongTopics = topics
    .map((t, i) => ({ topic: t, mastery: masteries[i] }))
    .filter(({ mastery }) => mastery.score !== null && mastery.score >= 81)
    .sort((a, b) => b.mastery.score - a.mastery.score)
    .slice(0, 5)
    .map(({ topic, mastery }) => ({ topicId: topic._id, topicName: topic.name, ...mastery }));

  return {
    subjectId,
    totalTopics: topics.length,
    topicsStarted: withScores.length,
    overallPrepPercent,
    weakTopics,
    strongTopics,
    topics: topics.map((t, i) => ({ topicId: t._id, topicName: t.name, order: t.order, weight: t.weight, ...masteries[i] })),
  };
}

/* ------------------------------------------------------------------ *
 * Recommended Next — explainable multi-factor recommendation.         *
 * Factors, in priority order (per spec): weak topics > PYQ frequency  *
 * > prerequisite ordering > recent performance. (Exam-proximity is a  *
 * documented P1 follow-up — see README "Known limitations": it needs *
 * a per-subject exam date, which isn't collected yet.)                *
 * ------------------------------------------------------------------ */

async function getRecommendedNextForSubject(userId, subjectId) {
  const mastery = await computeSubjectMastery(userId, subjectId);
  if (mastery.totalTopics === 0) return null;

  const pyqIntel = await getPYQIntelligenceForSubject(subjectId);
  const pyqCountByTopic = new Map(pyqIntel.distribution.filter((d) => d.topicId).map((d) => [String(d.topicId), d.totalQuestions]));

  const candidates = mastery.topics.map((t) => {
    const weakness = t.score === null ? 100 : 100 - t.score; // untouched topics score highest "weakness"
    const pyqBoost = (pyqCountByTopic.get(String(t.topicId)) || 0) * 5;
    const weightBoost = (t.weight || 3) * 4;
    const prereqPenalty = 0; // placeholder for future prerequisite-gating logic
    const priorityScore = weakness * 2 + pyqBoost + weightBoost - prereqPenalty;
    return { ...t, priorityScore, pyqCount: pyqCountByTopic.get(String(t.topicId)) || 0 };
  });

  candidates.sort((a, b) => b.priorityScore - a.priorityScore);
  const top = candidates[0];
  if (!top) return null;

  const reasons = [];
  if (top.score === null) reasons.push("you haven't attempted any quiz on this topic yet");
  else if (top.score <= 60) reasons.push(`your Estimated Mastery here is ${top.score}% (${top.state})`);
  if (top.pyqCount > 0) reasons.push(`it has ${top.pyqCount} recorded previous-year question${top.pyqCount === 1 ? "" : "s"}`);
  if ((top.weight || 3) >= 4) reasons.push("it's weighted as a high-importance topic in this subject");

  return {
    topicId: top.topicId,
    topicName: top.topicName,
    action: top.score === null ? "Start this topic" : "Review and re-quiz this topic",
    reasons: reasons.length ? reasons : ["it's the best next step based on your current activity"],
  };
}

async function getMyAcademicSpace(userId) {
  const user = await User.findById(userId).select("academic");
  const { branch, semester } = user?.academic || {};
  if (!branch || !semester) {
    return { academicProfileComplete: false, subjects: [] };
  }

  const subjects = await Subject.find({ branch, semester, isActive: true }).sort({ name: 1 });

  const subjectCards = await Promise.all(
    subjects.map(async (s) => {
      const mastery = await computeSubjectMastery(userId, s._id);
      const recommendedNext = await getRecommendedNextForSubject(userId, s._id);
      return {
        subjectId: s._id,
        name: s.name,
        code: s.code,
        preparationPercent: mastery.overallPrepPercent,
        totalTopics: mastery.totalTopics,
        topicsStarted: mastery.topicsStarted,
        weakTopics: mastery.weakTopics,
        strongTopics: mastery.strongTopics,
        recommendedNext,
      };
    })
  );

  return { academicProfileComplete: true, subjects: subjectCards };
}

/* ------------------------------------------------------------------ *
 * "Ask My Course" — contextual RAG scoped to the student's academic   *
 * hierarchy. Reuses aiProvider (the same OpenAI wrapper everything     *
 * else uses) and NoteChunk embeddings from notes mapped to this       *
 * topic. Explicitly instructed to say when something is general       *
 * knowledge rather than invent university-specific facts.             *
 * ------------------------------------------------------------------ */

async function askMyCourse({ userId, topicId, question }) {
  if (!question || question.trim().length < 3) {
    throw new AppError("Please ask a more specific question.", 400, "VALIDATION_ERROR");
  }
  await assertWithinDailyLimit(userId, "ask_course");

  const topic = await getTopicById(topicId);
  const mappedNotes = await Note.find({ "academicMapping.topic": topicId, status: "published", aiStatus: "ready" }).select("_id title");
  const pyqs = await PYQ.find({ topic: topicId }).sort({ year: -1 }).limit(5);

  // Retrieve the most relevant chunks across all notes mapped to this topic.
  let contextText = "";
  let sources = [];
  if (mappedNotes.length > 0) {
    const questionEmbedding = await aiProvider.embed(question);
    const chunks = await NoteChunk.find({ note: { $in: mappedNotes.map((n) => n._id) } });
    const ranked = chunks
      .map((c) => ({ text: c.text, note: c.note, score: cosineSimilarity(questionEmbedding, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    contextText = ranked.map((c) => c.text).join("\n\n---\n\n");
    const noteTitleById = new Map(mappedNotes.map((n) => [String(n._id), n.title]));
    sources = Array.from(new Set(ranked.map((c) => String(c.note)))).map((id) => ({ type: "note", title: noteTitleById.get(id) }));
  }

  const pyqContext = pyqs.map((q) => `(${q.year}) ${q.questionText}`).join("\n");
  if (pyqs.length) sources.push({ type: "pyq", title: `${pyqs.length} related previous-year question(s)` });

  const objectives = (topic.learningObjectives || []).map((o) => o.text).join("; ");

  const system = `You are "Ask My Course", an academic assistant for the topic "${topic.name}" (unit: ${topic.unit?.name || "N/A"}, subject: ${topic.subject?.name || "N/A"}).
Learning objectives for this topic: ${objectives || "not specified"}.

Course material excerpts (may be empty if no notes are mapped yet):
${contextText || "(no mapped notes available for this topic yet)"}

Related previous-year questions:
${pyqContext || "(none recorded yet)"}

Answer the student's question using this structure, with clear headings:
1. Simple Explanation — plain-language explanation of the concept
2. Exam-Oriented Definition — a crisp, exam-ready definition
3. Example — a concrete example (or worked numerical/code example if relevant)
4. Complexity / Difficulty — how conceptually hard this typically is for students
5. Common Exam Questions — 2-3 question styles typically asked on this
6. Related PYQs — reference the previous-year questions above if any were relevant, otherwise say none are recorded yet
7. Practice Questions — 2 short practice questions for the student to try

CRITICAL RULES:
- If the course material excerpts don't cover something, answer from general subject knowledge but CLEARLY say "This part is general knowledge, not from your specific course material."
- Never invent university-specific facts, syllabus details, or exam patterns that aren't given to you above.
- Do not claim certainty about what will appear on an exam — only describe historical patterns if asked.`;

  const { text, tokensUsed } = await aiProvider.chatComplete({ system, user: question });

  await AIInteraction.create({ user: userId, topic: topicId, type: "ask_course", inputKey: question.trim().toLowerCase(), input: { question }, output: text, tokensUsed });

  return { answer: text, sources, basedOnNoteCount: mappedNotes.length, basedOnPYQCount: pyqs.length };
}

module.exports = {
  createUniversity, listUniversities,
  createProgram, listProgramsByUniversity,
  createBranch, listBranchesByProgram,
  createSubject, listSubjectsByBranchSemester,
  createUnit, listUnitsBySubject,
  createTopic, listTopicsByUnit, listTopicsBySubject, getTopicById,
  createPYQ, getPYQIntelligenceForSubject,
  setMyAcademicProfile, getMyAcademicProfile,
  computeTopicMastery, computeSubjectMastery,
  getRecommendedNextForSubject, getMyAcademicSpace,
  askMyCourse,
};
