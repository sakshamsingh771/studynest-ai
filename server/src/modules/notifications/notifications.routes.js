const express = require("express");
const controller = require("./notifications.controller");
const { protect } = require("../../middleware/auth");

const router = express.Router();
router.use(protect);

router.get("/", controller.list);
router.patch("/:id/read", controller.markRead);
router.patch("/read-all", controller.markAllRead);

module.exports = router;
