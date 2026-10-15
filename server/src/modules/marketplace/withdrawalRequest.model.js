const mongoose = require("mongoose");
const { Schema } = mongoose;

const withdrawalRequestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    // Manual payout for this phase — an admin marks it approved once they've
    // actually sent the money via UPI/bank transfer. Automated payouts (Razorpay
    // Payouts / RazorpayX) are a real integration but a separate, KYC-gated API
    // surface — deliberately out of scope here.
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
