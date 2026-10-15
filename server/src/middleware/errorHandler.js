const multer = require("multer");
const AppError = require("../utils/AppError");

// Human-readable text for Multer's own error codes (file-too-large, wrong
// field name, etc.) — without this, these errors had no statusCode set and
// fell through to a generic 500, even though multer's message is already
// understandable on its own.
const MULTER_ERROR_MESSAGES = {
  LIMIT_FILE_SIZE: "File is too large. Maximum upload size is 25MB.",
  LIMIT_UNEXPECTED_FILE: "Unexpected file field — please use the file upload field provided.",
};

// Centralized error handler — the ONLY place in the app that shapes error responses.
// Controllers just `throw new AppError(...)` and never think about response formatting.
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || "INTERNAL_ERROR";
  let message = err.message || "Something went wrong";

  // Mongoose validation errors -> 400, with field-level detail
  if (err.name === "ValidationError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }

  // Malformed ObjectId (e.g. a garbage/invalid id submitted for a ref field like
  // academicMapping.subject or academic.university) — without this, Mongoose's
  // CastError fell through to a generic 500 "Something went wrong", which is
  // both the wrong status code and unhelpful to the client.
  if (err.name === "CastError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = `Invalid value for "${err.path}".`;
  }

  // Multer upload errors (file too large, wrong field, etc.) — the file-type
  // rejection itself already throws a proper AppError from fileFilter, this
  // just covers multer's own built-in checks.
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    code = "UPLOAD_ERROR";
    message = MULTER_ERROR_MESSAGES[err.code] || err.message;
  }

  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_KEY";
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field} is already in use`;
  }

  if (process.env.NODE_ENV !== "production" && !err.isOperational) {
    console.error(err); // full stack trace for unexpected bugs, dev only
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { code: "ROUTE_NOT_FOUND", message: `No route: ${req.method} ${req.originalUrl}` },
  });
}

module.exports = { errorHandler, notFoundHandler };
