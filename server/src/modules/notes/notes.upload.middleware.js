const multer = require("multer");
const AppError = require("../../utils/AppError");

// Files are held in memory only long enough to hand off to storageService —
// never written to disk by multer itself, since storageService owns that.
const storage = multer.memoryStorage();

const ALLOWED_MIME_TO_TYPE = {
  "application/pdf": "pdf",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
};

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TO_TYPE[file.mimetype]) {
    return cb(new AppError(`Unsupported file type: ${file.mimetype}`, 400, "UNSUPPORTED_FILE_TYPE"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB — generous for lecture PDFs, blocks abuse
});

function resolveNoteType(mimetype) {
  return ALLOWED_MIME_TO_TYPE[mimetype];
}

module.exports = { upload, resolveNoteType };
