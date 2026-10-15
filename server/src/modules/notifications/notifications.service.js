const Notification = require("./notification.model");
const { emitToUser } = require("../../sockets");

// Every notification in the app is created through this one function:
// it's both the persistence write AND the real-time push, so callers
// (community.service, marketplace.service, admin.service) never touch
// sockets directly and never forget to save one or the other.
async function notify({ recipient, type, message, payload = {} }) {
  const notification = await Notification.create({ recipient, type, message, payload });
  emitToUser(recipient, "notification", notification);
  return notification;
}

async function listForUser(userId) {
  return Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(50);
}

async function unreadCount(userId) {
  return Notification.countDocuments({ recipient: userId, isRead: false });
}

async function markRead(notificationId, userId) {
  await Notification.updateOne({ _id: notificationId, recipient: userId }, { $set: { isRead: true } });
}

async function markAllRead(userId) {
  await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });
}

module.exports = { notify, listForUser, unreadCount, markRead, markAllRead };
