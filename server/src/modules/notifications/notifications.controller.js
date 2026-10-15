const notificationsService = require("./notifications.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

const list = asyncHandler(async (req, res) => {
  const [notifications, unread] = await Promise.all([
    notificationsService.listForUser(req.user._id),
    notificationsService.unreadCount(req.user._id),
  ]);
  sendSuccess(res, { data: { notifications, unreadCount: unread } });
});

const markRead = asyncHandler(async (req, res) => {
  await notificationsService.markRead(req.params.id, req.user._id);
  sendSuccess(res, { data: null });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationsService.markAllRead(req.user._id);
  sendSuccess(res, { data: null });
});

module.exports = { list, markRead, markAllRead };
