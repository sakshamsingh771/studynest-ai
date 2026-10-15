const mongoose = require("mongoose");
const { Schema } = mongoose;

// Same order->verify pattern as Purchase and SubscriptionOrder — one row per
// "Add Money" attempt, so the wallet transaction history has a real receipt
// (razorpayPaymentId) to point back to for every top-up, not just a bare credit.
const walletTopupSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },

    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WalletTopup", walletTopupSchema);
