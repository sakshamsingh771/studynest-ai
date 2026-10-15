const mongoose = require("mongoose");
const { Schema } = mongoose;

// One wallet per user, lazily created on first sale/withdrawal. Balance is in
// the smallest currency unit's major form (e.g. rupees, not paise) for readability —
// paise conversion happens only at the Razorpay API boundary (paymentProvider.js).
const walletSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
