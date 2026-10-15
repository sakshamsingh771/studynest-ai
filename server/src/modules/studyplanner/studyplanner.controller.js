const plannerService = require("./studyplanner.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

const addSubject = asyncHandler(async (req, res) => {
  const subject = await plannerService.addSubject({ userId: req.user._id, ...req.body });
  sendSuccess(res, { statusCode: 201, data: { subject } });
});

const listSubjects = asyncHandler(async (req, res) => {
  const subjects = await plannerService.listSubjects(req.user._id);
  sendSuccess(res, { data: { subjects } });
});

const deleteSubject = asyncHandler(async (req, res) => {
  await plannerService.deleteSubject({ userId: req.user._id, subjectId: req.params.id });
  sendSuccess(res, { data: null, message: "Subject removed." });
});

const scheduleSession = asyncHandler(async (req, res) => {
  const session = await plannerService.scheduleSession({ userId: req.user._id, ...req.body });
  sendSuccess(res, { statusCode: 201, data: { session } });
});

const listSessions = asyncHandler(async (req, res) => {
  const sessions = await plannerService.listSessions({ userId: req.user._id, upcoming: req.query.upcoming });
  sendSuccess(res, { data: { sessions } });
});

const completeSession = asyncHandler(async (req, res) => {
  const session = await plannerService.completeSession({ userId: req.user._id, sessionId: req.params.id });
  sendSuccess(res, { data: { session } });
});

const deleteSession = asyncHandler(async (req, res) => {
  await plannerService.deleteSession({ userId: req.user._id, sessionId: req.params.id });
  sendSuccess(res, { data: null, message: "Session removed." });
});

const generateAIPlan = asyncHandler(async (req, res) => {
  const sessions = await plannerService.generateAIPlan({ userId: req.user._id, subjectId: req.params.id });
  sendSuccess(res, { data: { sessions } });
});

module.exports = {
  addSubject, listSubjects, deleteSubject,
  scheduleSession, listSessions, completeSession, deleteSession,
  generateAIPlan,
};
