const express = require("express");
const controller = require("./studyplanner.controller");
const { protect } = require("../../middleware/auth");

const router = express.Router();
router.use(protect); // the planner is entirely personal — every route needs a logged-in user

router.post("/subjects", controller.addSubject);
router.get("/subjects", controller.listSubjects);
router.delete("/subjects/:id", controller.deleteSubject);
router.post("/subjects/:id/generate-plan", controller.generateAIPlan);

router.post("/sessions", controller.scheduleSession);
router.get("/sessions", controller.listSessions);
router.patch("/sessions/:id/complete", controller.completeSession);
router.delete("/sessions/:id", controller.deleteSession);

module.exports = router;
