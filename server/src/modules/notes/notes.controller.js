const notesService = require("./notes.service");
const { validateCreateNote } = require("./notes.validation");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

const createNote = asyncHandler(async (req, res) => {
  validateCreateNote(req.body);
  const note = await notesService.createNote({ authorId: req.user._id, body: req.body, file: req.file });
  sendSuccess(res, { statusCode: 201, data: { note } });
});

const listNotes = asyncHandler(async (req, res) => {
  const { notes, meta } = await notesService.listNotes(req.query);
  sendSuccess(res, { data: { notes }, meta });
});

const getNote = asyncHandler(async (req, res) => {
  const note = await notesService.getNoteById(req.params.id, req.user?._id);
  sendSuccess(res, { data: { note } });
});

const getRelatedNotes = asyncHandler(async (req, res) => {
  const notes = await notesService.getRelatedNotes(req.params.id);
  sendSuccess(res, { data: { notes } });
});

const trackDownload = asyncHandler(async (req, res) => {
  const result = await notesService.trackDownload(req.params.id, req.user?._id);
  sendSuccess(res, { data: result });
});

const updateNote = asyncHandler(async (req, res) => {
  const note = await notesService.updateNote({
    id: req.params.id,
    userId: req.user._id,
    userRole: req.user.role,
    updates: req.body,
  });
  sendSuccess(res, { data: { note } });
});

const deleteNote = asyncHandler(async (req, res) => {
  await notesService.deleteNote({ id: req.params.id, userId: req.user._id, userRole: req.user.role });
  sendSuccess(res, { data: null, message: "Note archived." });
});

const listByAcademicMapping = asyncHandler(async (req, res) => {
  const notes = await notesService.listNotesByAcademicMapping({
    subjectId: req.query.subjectId, topicId: req.query.topicId, limit: req.query.limit,
  });
  sendSuccess(res, { data: { notes } });
});

const listMyNotes = asyncHandler(async (req, res) => {
  const notes = await notesService.listMyNotes(req.user._id);
  sendSuccess(res, { data: { notes } });
});

module.exports = { createNote, listNotes, getNote, trackDownload, getRelatedNotes, updateNote, deleteNote, listByAcademicMapping, listMyNotes };
