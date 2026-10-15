const service = require("./public.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

const getStats = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.getPublicStats() });
});

module.exports = { getStats };
