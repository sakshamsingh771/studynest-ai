const express = require("express");
const controller = require("./admin.controller");
const { protect } = require("../../middleware/auth");
const { restrictTo } = require("../../middleware/rbac");

const router = express.Router();
router.use(protect, restrictTo("admin")); // every route below requires an authenticated admin

router.get("/overview", controller.overview);

router.get("/users", controller.listUsers);
router.patch("/users/:id", controller.updateUser);

router.get("/notes", controller.listNotes);
router.patch("/notes/:id", controller.moderateNote);

router.get("/withdrawals", controller.listWithdrawals);
router.patch("/withdrawals/:id", controller.resolveWithdrawal);

module.exports = router;
