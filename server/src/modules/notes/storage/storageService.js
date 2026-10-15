// StorageService abstraction — every other module talks to THIS interface,
// never to a specific provider's SDK directly. Today it's local disk (zero
// external accounts needed to run the project). Swapping to Cloudinary or S3
// later means rewriting only this one file — controllers/services never change.
//
// Interface contract:
//   upload(fileBuffer, { originalName, mimeType }) -> { url, storageKey }
//   remove(storageKey) -> void

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const env = require("../../../config/env");

const UPLOAD_DIR = path.join(__dirname, "../../../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

async function upload(fileBuffer, { originalName }) {
  const ext = path.extname(originalName);
  const storageKey = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const destPath = path.join(UPLOAD_DIR, storageKey);

  await fs.promises.writeFile(destPath, fileBuffer);

  // Served statically by Express at /uploads (see app.js). In the Cloudinary/S3
  // version, this would instead be the CDN URL returned by that provider.
  const url = `${env.clientApiOrigin}/uploads/${storageKey}`;
  return { url, storageKey };
}

async function remove(storageKey) {
  const filePath = path.join(UPLOAD_DIR, storageKey);
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") throw err; // ignore "already gone", surface anything else
  }
}

module.exports = { upload, remove };
