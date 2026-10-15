// paymentProvider — the ONLY file that imports the Razorpay SDK, same pattern
// as aiProvider.js and storageService.js. Swapping to Stripe/PayU later means
// rewriting only this file.
const Razorpay = require("razorpay");
const crypto = require("crypto");
const env = require("../../config/env");
const AppError = require("../../utils/AppError");

let client = null;
function getClient() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new AppError(
      "Payments aren't configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to server/.env.",
      503,
      "PAYMENTS_NOT_CONFIGURED"
    );
  }
  if (!client) client = new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
  return client;
}

// Razorpay works in paise (smallest unit) — this is the one place that
// conversion happens, so the rest of the app can just think in rupees.
async function createOrder({ amountInRupees, receipt }) {
  const razorpay = getClient();
  const order = await razorpay.orders.create({
    amount: Math.round(amountInRupees * 100),
    currency: "INR",
    receipt,
  });
  return order; // { id, amount, currency, ... }
}

function verifySignature({ orderId, paymentId, signature }) {
  if (!env.razorpayKeySecret) {
    throw new AppError("Payments aren't configured.", 503, "PAYMENTS_NOT_CONFIGURED");
  }
  const expected = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

function getPublicKeyId() {
  return env.razorpayKeyId;
}

module.exports = { createOrder, verifySignature, getPublicKeyId };
