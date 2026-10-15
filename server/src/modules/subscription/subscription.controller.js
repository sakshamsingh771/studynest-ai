const subscriptionService = require("./subscription.service");
const { PLANS } = require("./planConfig");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const AppError = require("../../utils/AppError");

const listPlans = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { plans: PLANS } });
});

const initiate = asyncHandler(async (req, res) => {
  const result = await subscriptionService.initiateSubscription({ userId: req.user._id, plan: req.body.plan });
  sendSuccess(res, { statusCode: 201, data: result });
});

const verify = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError("Missing payment verification fields.", 400, "VALIDATION_ERROR");
  }
  const order = await subscriptionService.verifySubscriptionPayment({
    userId: req.user._id, orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature,
  });
  sendSuccess(res, { data: { order } });
});

const myStatus = asyncHandler(async (req, res) => {
  const status = await subscriptionService.getMyStatus(req.user._id);
  sendSuccess(res, { data: status });
});

const billingHistory = asyncHandler(async (req, res) => {
  const history = await subscriptionService.listMyBillingHistory(req.user._id);
  sendSuccess(res, { data: { history } });
});

module.exports = { listPlans, initiate, verify, myStatus, billingHistory };
