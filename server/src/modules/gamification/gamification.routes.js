const express = require("express");
const { getLeaderboard } = require("./gamification.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

const router = express.Router();

router.get("/leaderboard", asyncHandler(async (req, res) => {
  const users = await getLeaderboard(Number(req.query.limit) || 20);
  sendSuccess(res, { data: { users } });
}));

module.exports = router;
