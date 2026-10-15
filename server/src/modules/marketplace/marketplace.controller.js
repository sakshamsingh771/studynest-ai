const marketplaceService = require("./marketplace.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");
const AppError = require("../../utils/AppError");

const initiatePurchase = asyncHandler(async (req, res) => {
  const result = await marketplaceService.initiatePurchase({
    userId: req.user._id, noteId: req.params.noteId, couponCode: req.body.couponCode,
  });
  sendSuccess(res, { statusCode: 201, data: result });
});

const purchaseWithWallet = asyncHandler(async (req, res) => {
  const purchase = await marketplaceService.purchaseWithWallet({
    userId: req.user._id, noteId: req.params.noteId, couponCode: req.body.couponCode,
  });
  sendSuccess(res, { statusCode: 201, data: { purchase } });
});

const verifyPurchase = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError("Missing payment verification fields.", 400, "VALIDATION_ERROR");
  }
  const purchase = await marketplaceService.verifyPurchase({
    userId: req.user._id, orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature,
  });
  sendSuccess(res, { data: { purchase } });
});

const getWallet = asyncHandler(async (req, res) => {
  const wallet = await marketplaceService.getWallet(req.user._id);
  sendSuccess(res, { data: wallet });
});

const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) throw new AppError("Enter a valid withdrawal amount.", 400, "VALIDATION_ERROR");
  const request = await marketplaceService.requestWithdrawal({ userId: req.user._id, amount });
  sendSuccess(res, { statusCode: 201, data: { request } });
});

const myPurchases = asyncHandler(async (req, res) => {
  const purchases = await marketplaceService.listMyPurchases(req.user._id);
  sendSuccess(res, { data: { purchases } });
});

const mySales = asyncHandler(async (req, res) => {
  const sales = await marketplaceService.listMySales(req.user._id);
  sendSuccess(res, { data: { sales } });
});

module.exports = { initiatePurchase, verifyPurchase, getWallet, requestWithdrawal, myPurchases, mySales, purchaseWithWallet };
