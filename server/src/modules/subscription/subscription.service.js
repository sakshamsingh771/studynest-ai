const User = require("../users/user.model");
const SubscriptionOrder = require("./subscriptionOrder.model");
const paymentProvider = require("../marketplace/paymentProvider"); // reused — same Razorpay abstraction, no need to duplicate it
const AppError = require("../../utils/AppError");
const { PLANS, SUBSCRIPTION_DURATION_DAYS } = require("./planConfig");

// Reads the user's plan with expiry already accounted for — a lapsed
// subscription is treated as "free" everywhere in the app without needing a
// cron job to eagerly downgrade the stored document. If code elsewhere wants
// to *display* "your Premium expired on ..." it can still read the raw
// user.subscription fields directly; this helper is for access-control checks.
function getEffectivePlan(user) {
  const sub = user.subscription || { plan: "free", expiresAt: null };
  if (sub.plan === "free") return "free";
  if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) return "free"; // expired
  return sub.plan;
}

async function initiateSubscription({ userId, plan }) {
  if (!PLANS[plan] || plan === "free") {
    throw new AppError("Invalid plan selected.", 400, "INVALID_PLAN");
  }

  const razorpayOrder = await paymentProvider.createOrder({
    amountInRupees: PLANS[plan].priceMonthly,
    receipt: `sub_${plan}_user_${userId}_${Date.now()}`,
  });

  await SubscriptionOrder.create({
    user: userId,
    plan,
    amount: PLANS[plan].priceMonthly,
    razorpayOrderId: razorpayOrder.id,
    status: "created",
  });

  return {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: paymentProvider.getPublicKeyId(),
    plan,
    planLabel: PLANS[plan].label,
  };
}

async function verifySubscriptionPayment({ userId, orderId, paymentId, signature }) {
  const isValid = paymentProvider.verifySignature({ orderId, paymentId, signature });
  if (!isValid) {
    throw new AppError("Payment verification failed.", 400, "SIGNATURE_INVALID");
  }

  const order = await SubscriptionOrder.findOne({ razorpayOrderId: orderId, user: userId });
  if (!order) throw new AppError("Subscription order not found.", 404, "ORDER_NOT_FOUND");
  if (order.status === "paid") return order; // idempotent retry

  order.status = "paid";
  order.razorpayPaymentId = paymentId;
  order.razorpaySignature = signature;
  await order.save();

  const user = await User.findById(userId);
  const currentlyActive = user.subscription?.plan !== "free" && user.subscription?.expiresAt && new Date(user.subscription.expiresAt) > new Date();

  // Renewing early (before the current period ends) extends from the existing
  // expiry rather than from today, so paying a few days early never costs the
  // user those remaining days.
  const baseDate = currentlyActive && user.subscription.plan === order.plan ? new Date(user.subscription.expiresAt) : new Date();
  const expiresAt = new Date(baseDate.getTime() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  user.subscription = { plan: order.plan, expiresAt };
  user.isPremium = true; // kept in sync for any existing code/UI reading the legacy flag
  await user.save();

  return order;
}

async function getMyStatus(userId) {
  const user = await User.findById(userId).select("subscription isPremium");
  const effectivePlan = getEffectivePlan(user);
  return {
    plan: effectivePlan,
    rawPlan: user.subscription?.plan || "free", // what they paid for, even if it has since expired
    expiresAt: user.subscription?.expiresAt || null,
    isExpired: effectivePlan === "free" && user.subscription?.plan !== "free",
  };
}

async function listMyBillingHistory(userId) {
  return SubscriptionOrder.find({ user: userId, status: "paid" }).sort({ createdAt: -1 });
}

module.exports = { getEffectivePlan, initiateSubscription, verifySubscriptionPayment, getMyStatus, listMyBillingHistory };
