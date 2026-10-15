const express = require("express");
const controller = require("./users.controller");
const { protect } = require("../../middleware/auth");

const router = express.Router();

router.get("/me", protect, controller.getMyProfile);
router.patch("/me", protect, controller.updateMyProfile);

module.exports = router;
