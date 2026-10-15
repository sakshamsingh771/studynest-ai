const mongoose = require("mongoose");
const { Schema } = mongoose;

const purchaseSchema = new Schema(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: Schema.Types.ObjectId, ref: "Note", required: true, index: true },

    originalAmount: { type: Number, required: true },
    discountApplied: { type: Number, default: 0 },
    amount: { type: Number, required: true }, // originalAmount - discountApplied — what was actually charged
    couponCode: { type: String, default: null },

    razorpayOrderId: { type: String, unique: true, sparse: true }, // absent for wallet-paid purchases — sparse index allows that
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    // How this purchase was actually paid for — Razorpay checkout (card/UPI/etc.)
    // or straight from the buyer's in-app wallet balance. Both end in the same
    // "paid" status and the same seller payout; this is just for the receipt.
    paymentMethod: { type: String, enum: ["razorpay", "wallet"], default: "razorpay" },

    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
  },
  { timestamps: true }
);

// A buyer should only hold ONE paid purchase per note — prevents double-charging
// on a retry, while still allowing multiple "created but abandoned" attempts
// (hence this is a partial index, only enforced when status is "paid").
purchaseSchema.index(
  { buyer: 1, note: 1 },
  { unique: true, partialFilterExpression: { status: "paid" } }
);

module.exports = mongoose.model("Purchase", purchaseSchema);
