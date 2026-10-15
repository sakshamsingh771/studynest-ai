const service = require("./academic.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

// ---- Hierarchy: create (teacher/admin only, see routes.js) ----
const createUniversity = asyncHandler(async (req, res) => {
  const university = await service.createUniversity({ ...req.body, userId: req.user._id });
  sendSuccess(res, { statusCode: 201, data: { university } });
});
const createProgram = asyncHandler(async (req, res) => {
  const program = await service.createProgram(req.body);
  sendSuccess(res, { statusCode: 201, data: { program } });
});
const createBranch = asyncHandler(async (req, res) => {
  const branch = await service.createBranch(req.body);
  sendSuccess(res, { statusCode: 201, data: { branch } });
});
const createSubject = asyncHandler(async (req, res) => {
  const subject = await service.createSubject(req.body);
  sendSuccess(res, { statusCode: 201, data: { subject } });
});
const createUnit = asyncHandler(async (req, res) => {
  const unit = await service.createUnit(req.body);
  sendSuccess(res, { statusCode: 201, data: { unit } });
});
const createTopic = asyncHandler(async (req, res) => {
  const topic = await service.createTopic(req.body);
  sendSuccess(res, { statusCode: 201, data: { topic } });
});
const createPYQ = asyncHandler(async (req, res) => {
  const pyq = await service.createPYQ({ ...req.body, addedBy: req.user._id });
  sendSuccess(res, { statusCode: 201, data: { pyq } });
});

// ---- Hierarchy: cascading reads (public — needed by signup/profile pickers) ----
const listUniversities = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { universities: await service.listUniversities() } });
});
const listPrograms = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { programs: await service.listProgramsByUniversity(req.query.universityId) } });
});
const listBranches = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { branches: await service.listBranchesByProgram(req.query.programId) } });
});
const listSubjects = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { subjects: await service.listSubjectsByBranchSemester({ branchId: req.query.branchId, semester: req.query.semester }) } });
});
const listUnits = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { units: await service.listUnitsBySubject(req.query.subjectId) } });
});
const listTopics = asyncHandler(async (req, res) => {
  const topics = req.query.unitId
    ? await service.listTopicsByUnit(req.query.unitId)
    : await service.listTopicsBySubject(req.query.subjectId);
  sendSuccess(res, { data: { topics } });
});
const getTopic = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { topic: await service.getTopicById(req.params.id) } });
});

// ---- Academic profile ----
const getMyProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { academic: await service.getMyAcademicProfile(req.user._id) } });
});
const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await service.setMyAcademicProfile(req.user._id, req.body);
  sendSuccess(res, { data: { academic: user.academic } });
});

// ---- My Academic Space ----
const getMySpace = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.getMyAcademicSpace(req.user._id) });
});

// ---- Mastery ----
const getTopicMastery = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.computeTopicMastery(req.user._id, req.params.topicId) });
});
const getSubjectMastery = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.computeSubjectMastery(req.user._id, req.params.subjectId) });
});

// ---- Recommended Next ----
const getRecommendedNext = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { recommendation: await service.getRecommendedNextForSubject(req.user._id, req.params.subjectId) } });
});

// ---- PYQ Intelligence ----
const getPYQIntelligence = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.getPYQIntelligenceForSubject(req.params.subjectId) });
});

// ---- Ask My Course ----
const askMyCourse = asyncHandler(async (req, res) => {
  const result = await service.askMyCourse({ userId: req.user._id, topicId: req.body.topicId, question: req.body.question });
  sendSuccess(res, { data: result });
});

module.exports = {
  createUniversity, createProgram, createBranch, createSubject, createUnit, createTopic, createPYQ,
  listUniversities, listPrograms, listBranches, listSubjects, listUnits, listTopics, getTopic,
  getMyProfile, updateMyProfile, getMySpace,
  getTopicMastery, getSubjectMastery, getRecommendedNext, getPYQIntelligence,
  askMyCourse,
};
