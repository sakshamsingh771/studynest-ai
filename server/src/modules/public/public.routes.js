const express = require("express");
const controller = require("./public.controller");

const router = express.Router();

// Public, unauthenticated, read-only, real-data-only — safe for the landing
// page to call before anyone logs in.
router.get("/stats", controller.getStats);

module.exports = router;
