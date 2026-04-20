// src/api/controllers/job.controller.js
const { downloadTokens } = require("./download.controller");
const path = require("path");
const fs = require("fs");
const { Queue } = require("bullmq"); // Added for getJobProgress

const connection = require("../../config/redis");

const downloadsDir = path.join(__dirname, "../../../downloads");

/**
 * Existing: Check if a download token's file is ready
 */
exports.getJobStatus = async (req, res) => {
  try {
    const { id: token } = req.params;

    if (!downloadTokens.has(token)) {
      return res.status(404).json({ success: false, message: "Invalid token" });
    }

    const { fileName } = downloadTokens.get(token);
    const filePath = path.join(downloadsDir, fileName);
    const ready = fs.existsSync(filePath);

    console.log("Checking file:", filePath);
    console.log("Exists:", ready);

    res.json({ success: true, ready });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to get job status" });
  }
};

/**
 * New: Get live download progress for a token/job
 */
exports.getJobProgress = async (req, res) => {
  try {
    const { token } = req.params;

    const tokenData = downloadTokens.get(token);
    if (!tokenData || !tokenData.jobId) {
      return res.status(404).json({ success: false, message: "Invalid token" });
    }

    const queue = new Queue("download-video", { connection });
    const job = await queue.getJob(tokenData.jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // FIX
    let progress = job.progress || 0;

    const isCompleted = await job.isCompleted();

    res.json({
      success: true,
      progress,
      isCompleted
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to get progress" });
  }
};