const adminService = require("./admin.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

const overview = asyncHandler(async (req, res) => {
  const stats = await adminService.getOverview();
  sendSuccess(res, { data: stats });
});

const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await adminService.listUsers(req.query);
  sendSuccess(res, { data: { users }, meta });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUser(req.params.id, req.body);
  sendSuccess(res, { data: { user } });
});

const listNotes = asyncHandler(async (req, res) => {
  const { notes, meta } = await adminService.listNotesForModeration(req.query);
  sendSuccess(res, { data: { notes }, meta });
});

const moderateNote = asyncHandler(async (req, res) => {
  const note = await adminService.moderateNote(req.params.id, req.body.status);
  sendSuccess(res, { data: { note } });
});

const listWithdrawals = asyncHandler(async (req, res) => {
  const withdrawals = await adminService.listWithdrawals(req.query);
  sendSuccess(res, { data: { withdrawals } });
});

const resolveWithdrawal = asyncHandler(async (req, res) => {
  const request = await adminService.resolveWithdrawal(req.params.id, {
    approve: req.body.approve, adminNote: req.body.adminNote,
  });
  sendSuccess(res, { data: { request } });
});

module.exports = { overview, listUsers, updateUser, listNotes, moderateNote, listWithdrawals, resolveWithdrawal };
