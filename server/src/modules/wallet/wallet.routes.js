
const express = require("express");
const controller = require("./wallet.controller");
const { protect } = require("../../middleware/auth");

const router = express.Router();
router.use(protect);

router.get("/balance", controller.getBalance);
router.get("/topup/presets", controller.presetAmounts);
router.post("/topup/initiate", controller.initiateTopup);
router.post("/topup/verify", controller.verifyTopup);

module.exports = router;