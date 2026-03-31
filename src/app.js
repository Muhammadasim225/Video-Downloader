// VideoDownloaderSaaS/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const limiter = require("./utils/rateLimiter");
const videoInfoRoutes = require("./api/routes/videoInfo.routes");
const jobRoutes = require("./api/routes/job.routes");
const { downloadVideo } = require("./api/controllers/download.controller");
const { analyze } = require("./api/controllers/analyze.controller");
const downloadRoutes = require("./api/routes/download.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(limiter);

// Routes
app.post("/api/analyze", analyze);
app.post("/api/download", downloadVideo); // POST to queue download

app.use("/api/video-info", videoInfoRoutes);
app.use("/api/job", jobRoutes);

// Serve downloads folder
// const downloadsDir = path.join(__dirname, "../downloads");
// console.log("Serving downloads from:", downloadsDir);
app.use("/api/downloads", downloadRoutes);
// app.use("/api/downloads", express.static(downloadsDir));

module.exports = app;