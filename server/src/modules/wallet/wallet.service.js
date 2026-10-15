const Wallet = require("../marketplace/wallet.model");
const WalletTopup = require("./walletTopup.model");
const Transaction = require("../marketplace/transaction.model");
const paymentProvider = require("../marketplace/paymentProvider");
const AppError = require("../../utils/AppError");

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

async function getOrCreateWallet(userId) {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }
  return wallet;
}

async function getBalance(userId) {
  const wallet = await getOrCreateWallet(userId);
  const recent = await Transaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("type amount reason description createdAt");
  return { balance: wallet.balance, recentTransactions: recent };
}

async function initiateTopup({ userId, amount }) {
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt < 1 || amt > 10000) {
    throw new AppError("Amount must be between ₹1 and ₹10,000.", 400, "VALIDATION_ERROR");
  }

  const razorpayOrder = await paymentProvider.createOrder({
    amountInRupees: amt,
    receipt: `wallet_${userId}_${Date.now()}`,
  });

  await WalletTopup.create({
    user: userId,
    amount: amt,
    razorpayOrderId: razorpayOrder.id,
    status: "created",
  });

  return {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency || "INR",
    keyId: paymentProvider.getPublicKeyId(),
  };
}

async function verifyTopup({ userId, orderId, paymentId, signature }) {
  const isValid = paymentProvider.verifySignature({ orderId, paymentId, signature });
  if (!isValid) {
    throw new AppError("Payment signature verification failed.", 400, "SIGNATURE_INVALID");
  }

  const topup = await WalletTopup.findOne({ razorpayOrderId: orderId, user: userId });
  if (!topup) throw new AppError("Top-up order not found.", 404, "ORDER_NOT_FOUND");
  if (topup.status === "paid") return topup; // idempotent

  // Atomic credit
  const updatedWallet = await Wallet.findOneAndUpdate(
    { user: userId },
    { $inc: { balance: topup.amount } },
    { new: true, upsert: true }
  );

  topup.status = "paid";
  topup.razorpayPaymentId = paymentId;
  topup.razorpaySignature = signature;
  await topup.save();

  await Transaction.create({
    user: userId,
    type: "credit",
    amount: topup.amount,
    reason: "wallet_topup",
    description: `Wallet top-up ₹${topup.amount} (Razorpay ${paymentId})`,
  });

  return { topup, newBalance: updatedWallet.balance };
}

module.exports = {
  PRESET_AMOUNTS,
  getBalance,
  initiateTopup,
  verifyTopup,
};