const AppError = require("../../utils/AppError");

function validateCreateNote(body) {
  if (!body.title || body.title.trim().length < 3) {
    throw new AppError("Title must be at least 3 characters.", 400, "VALIDATION_ERROR");
  }
  if (body.semester !== undefined && body.semester !== "" ) {
    const sem = Number(body.semester);
    if (Number.isNaN(sem) || sem < 1 || sem > 12) {
      throw new AppError("Semester must be between 1 and 12.", 400, "VALIDATION_ERROR");
    }
  }
}

module.exports = { validateCreateNote };
