const express = require("express");
const controller = require("./notes.controller");
const { protect } = require("../../middleware/auth");
const { softAuth } = require("../../middleware/softAuth");
const { upload } = require("./notes.upload.middleware");

const router = express.Router();

// Public — anyone can browse notes without an account (per the homepage spec:
// "Users can browse public notes ... without logging in"). softAuth lets us
// still recognize a logged-in user here, so premium-note gating works correctly.
router.get("/", controller.listNotes);
router.get("/mine", protect, controller.listMyNotes);
router.get("/by-topic", controller.listByAcademicMapping); // must be registered before "/:id"
router.get("/:id", softAuth, controller.getNote);
router.get("/:id/related", controller.getRelatedNotes);
router.post("/:id/download", protect, controller.trackDownload);

// Authenticated
router.post("/", protect, upload.single("file"), controller.createNote);
router.patch("/:id", protect, controller.updateNote);
router.delete("/:id", protect, controller.deleteNote);

module.exports = router;
