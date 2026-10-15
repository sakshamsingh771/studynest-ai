const mongoose = require("mongoose");
const { Schema } = mongoose;

// One row per subscription payment attempt — mirrors Purchase.js's pattern for
// note purchases. A user accumulates one row per renewal, which doubles as
// their billing history.
const subscriptionOrderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: String, enum: ["premium", "creator"], required: true },
    amount: { type: Number, required: true },

    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionOrder", subscriptionOrderSchema);
