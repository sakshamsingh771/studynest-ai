// Wraps async route handlers so we never write try/catch in every controller.
// Any rejected promise is forwarded to Express's error-handling middleware.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
