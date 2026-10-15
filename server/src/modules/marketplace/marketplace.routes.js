const express = require("express");
const controller = require("./marketplace.controller");
const { protect } = require("../../middleware/auth");

// Mounted at /api/notes/:noteId/purchase
const purchaseRouter = express.Router({ mergeParams: true });
purchaseRouter.post("/", protect, controller.initiatePurchase);
purchaseRouter.post("/wallet", protect, controller.purchaseWithWallet);

// Mounted at /api/marketplace
const marketplaceRouter = express.Router();
marketplaceRouter.post("/verify-payment", protect, controller.verifyPurchase);
marketplaceRouter.get("/wallet", protect, controller.getWallet);
marketplaceRouter.post("/wallet/withdraw", protect, controller.requestWithdrawal);
marketplaceRouter.get("/my-purchases", protect, controller.myPurchases);
marketplaceRouter.get("/my-sales", protect, controller.mySales);

module.exports = { purchaseRouter, marketplaceRouter };
