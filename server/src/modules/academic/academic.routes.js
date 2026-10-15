const express = require("express");
const controller = require("./academic.controller");
const { protect } = require("../../middleware/auth");
const { restrictTo } = require("../../middleware/rbac");

const router = express.Router();

// ---- Cascading hierarchy reads — public, used by signup + profile + upload pickers ----
router.get("/universities", controller.listUniversities);
router.get("/programs", controller.listPrograms);
router.get("/branches", controller.listBranches);
router.get("/subjects", controller.listSubjects);
router.get("/units", controller.listUnits);
router.get("/topics", controller.listTopics);
router.get("/topics/:id", controller.getTopic);
router.get("/subjects/:subjectId/pyq-intelligence", controller.getPYQIntelligence);

// ---- Hierarchy writes — teachers/admins curate the syllabus content ----
router.post("/universities", protect, restrictTo("teacher", "admin"), controller.createUniversity);
router.post("/programs", protect, restrictTo("teacher", "admin"), controller.createProgram);
router.post("/branches", protect, restrictTo("teacher", "admin"), controller.createBranch);
router.post("/subjects", protect, restrictTo("teacher", "admin"), controller.createSubject);
router.post("/units", protect, restrictTo("teacher", "admin"), controller.createUnit);
router.post("/topics", protect, restrictTo("teacher", "admin"), controller.createTopic);
router.post("/pyqs", protect, restrictTo("teacher", "admin"), controller.createPYQ);

// ---- Everything below is personal — needs a logged-in student ----
router.use(protect);

router.get("/me/profile", controller.getMyProfile);
router.patch("/me/profile", controller.updateMyProfile);

router.get("/me/space", controller.getMySpace);

router.get("/topics/:topicId/mastery", controller.getTopicMastery);
router.get("/subjects/:subjectId/mastery", controller.getSubjectMastery);
router.get("/subjects/:subjectId/recommended-next", controller.getRecommendedNext);

router.post("/ask", controller.askMyCourse);

module.exports = router;
