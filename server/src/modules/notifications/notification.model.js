const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["new_comment", "new_follower", "note_purchased", "withdrawal_approved", "withdrawal_rejected", "note_flagged"],
      required: true,
    },
    message: { type: String, required: true },
    // Arbitrary extra data for the frontend to build a link (e.g. { noteId } to
    // navigate to /notes/:noteId when the notification is clicked).
    payload: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
