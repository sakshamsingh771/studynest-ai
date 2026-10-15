const express = require("express");
const controller = require("./ai.controller");
const { protect } = require("../../middleware/auth");
const { aiLimiter } = require("../../middleware/rateLimiter");

// mergeParams: true lets this router read :noteId from the parent mount path in app.js
const router = express.Router({ mergeParams: true });

router.use(protect); // every AI call requires a logged-in user (it costs money per call)

router.get("/status", controller.getStatus);
router.post("/reprocess", aiLimiter, controller.reprocess);
router.post("/summary", aiLimiter, controller.summary);
router.post("/flashcards", aiLimiter, controller.flashcards);
router.post("/quiz", aiLimiter, controller.quiz);
router.post("/quiz/attempt", controller.submitQuizAttempt);
router.post("/chat", aiLimiter, controller.chat);
router.get("/reviews", controller.listReviews);
router.post("/reviews", aiLimiter, controller.createReview);
router.delete("/reviews/:reviewId", controller.deleteReview);

module.exports = router;
