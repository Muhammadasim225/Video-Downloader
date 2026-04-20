// src/queues/worker.js
const { Queue } = require("bullmq");

const connection = require("../config/redis");

// Create and export the download queue
const downloadQueue = new Queue("download", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3, // automatic retries
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

module.exports = {
  downloadQueue,
};