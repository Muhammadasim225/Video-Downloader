// src/queues/download.queue.js
const { Queue } = require("bullmq");

const connection = {
  host: "127.0.0.1",
  port: 6379
};

const downloadQueue = new Queue("download-video", { connection });

module.exports = downloadQueue;