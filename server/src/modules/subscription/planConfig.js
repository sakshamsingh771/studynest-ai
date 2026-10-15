// Single source of truth for plan pricing/limits — both the backend enforcement
// and the frontend pricing page read from data derived from this shape (the
// frontend has its own small copy for display; this is what's actually enforced).
//
// Architecture note: this implements *manual-renewal* subscriptions (user pays
// for a 30-day period via a Razorpay order, exactly like a note purchase; renews
// by paying again before/after expiry). True auto-recurring billing (auto-debit
// via UPI Autopay / cards) needs Razorpay's separate Subscriptions API, which
// requires a Plan to be created in the Razorpay dashboard first — that's a
// dashboard/account-setup step, not something we can wire up without real
// account access. This is the "implement the proper architecture, don't fake
// the connection" version of that feature — swapping to real auto-billing
// later means changing subscription.service.js's initiate/verify functions to
// call razorpay.subscriptions.* instead of razorpay.orders.*, without touching
// anything that reads plan/expiresAt elsewhere in the app.

const PLANS = {
  free: {
    label: "Free",
    priceMonthly: 0,
    features: ["Basic notes access", "Limited AI summaries", "Limited AI flashcards", "Limited AI quizzes", "Basic storage"],
  },
  premium: {
    label: "Premium",
    priceMonthly: 199,
    features: [
      "Unlimited AI summaries", "Unlimited flashcards", "Unlimited AI quiz generation",
      "Unlimited AI chat with notes", "Access to premium notes marketplace", "Priority features",
    ],
  },
  creator: {
    label: "Creator",
    priceMonthly: 399,
    features: [
      "Everything in Premium", "Creator analytics dashboard", "Higher upload storage",
      "Advanced AI tools", "Priority support",
    ],
  },
};

// Applied only to users on the "free" plan (or expired). Premium/Creator = unlimited.
const FREE_DAILY_AI_LIMITS = {
  summary: 5,
  flashcards: 3,
  quiz: 3,
  chat: 10,
  ask_course: 10, // "Ask My Course" — same cost profile as chat-with-notes
  review: 3, // Document Review — one full-note analysis per call
};

const SUBSCRIPTION_DURATION_DAYS = 30;

module.exports = { PLANS, FREE_DAILY_AI_LIMITS, SUBSCRIPTION_DURATION_DAYS };
