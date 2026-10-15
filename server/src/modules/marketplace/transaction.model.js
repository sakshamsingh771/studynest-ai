const mongoose = require("mongoose");
const { Schema } = mongoose;

// Append-only ledger. Wallet.balance is a cached total for fast reads;
// this collection is the source of truth an admin/user can audit against it.
const transactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      enum: [
        "note_sale", "withdrawal", "withdrawal_rejected_refund",
        "wallet_topup", "note_purchase_wallet", "refund",
      ],
      required: true,
    },
    relatedNote: { type: Schema.Types.ObjectId, ref: "Note" },
    relatedPurchase: { type: Schema.Types.ObjectId, ref: "Purchase" },
    description: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
