// A structured error class so every error in the app carries an HTTP status
// and a machine-readable code — not just a human message.
class AppError extends Error {
  constructor(message, statusCode, code = "ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // distinguishes "expected" errors from real bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
