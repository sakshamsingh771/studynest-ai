const express = require("express");
const controller = require("./subscription.controller");
const { protect } = require("../../middleware/auth");

const router = express.Router();

router.get("/plans", controller.listPlans); // public — pricing page works for logged-out visitors
router.post("/initiate", protect, controller.initiate);
router.post("/verify-payment", protect, controller.verify);
router.get("/my-status", protect, controller.myStatus);
router.get("/billing-history", protect, controller.billingHistory);

module.exports = router;
