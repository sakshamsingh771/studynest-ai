const express = require("express");
const controller = require("./dashboard.controller");
const { protect } = require("../../middleware/auth");

const router = express.Router();
router.get("/overview", protect, controller.overview);

module.exports = router;
