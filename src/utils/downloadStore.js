// src/utils/downloadStore.js
const downloadStore = new Map();

/**
 * token → filePath mapping
 * Example:
 * downloadStore.set("jdRBZ0IZTeeo", { path: "downloads/video.mp4", ready: true });
 */
module.exports = { downloadStore };