// Every successful response follows the same envelope shape.
// This lets the frontend write one generic response-unwrapper for all API calls.
function sendSuccess(res, { statusCode = 200, data = null, meta = null, message = null }) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta && { meta }),
    ...(message && { message }),
  });
}

module.exports = { sendSuccess };
