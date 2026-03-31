// src/queues/worker.js
const { Queue } = require("bullmq");

// Redis connection options
const redisOptions = {
  host: "127.0.0.1",
  port: 6379,
};

// Create and export the download queue
const downloadQueue = new Queue("download", {
  connection: redisOptions,
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