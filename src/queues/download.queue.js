// src/queues/download.queue.js
const { Queue } = require("bullmq");

const connection = require("../config/redis");

const downloadQueue = new Queue("download-video", { connection });

module.exports = downloadQueue;