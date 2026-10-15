const dashboardService = require("./dashboard.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

const overview = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOverview(req.user._id);
  sendSuccess(res, { data });
});

module.exports = { overview };
