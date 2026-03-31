const router = require("express").Router();
const { getJobStatus, getJobProgress } = require("../controllers/job.controller");

// GET /api/job/:id/status
router.get("/:id/status", getJobStatus);

// GET /api/job/:token/progress
router.get("/:token/progress", getJobProgress);

module.exports = router;