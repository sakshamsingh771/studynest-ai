const walletService = require("./wallet.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const AppError = require("../../utils/AppError");

const presetAmounts = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { presets: walletService.PRESET_AMOUNTS } });
});

const initiateTopup = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  const result = await walletService.initiateTopup({ userId: req.user._id, amount });
  sendSuccess(res, { statusCode: 201, data: result });
});

const verifyTopup = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError("Missing payment verification fields.", 400, "VALIDATION_ERROR");
  }
  const topup = await walletService.verifyTopup({
    userId: req.user._id, orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature,
  });
  sendSuccess(res, { data: { topup } });
});

module.exports = { presetAmounts, initiateTopup, verifyTopup };
