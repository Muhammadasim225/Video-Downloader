const express = require("express");
const router = express.Router();
const { getVideoInfo } = require("../../utils/videoInfo");
const { addToQueue } = require("../../workers/download.worker"); // your BullMQ worker
const { directDownload } = require("../../utils/directDownload"); // we will create this
const { downloadStore } = require("../../utils/downloadStore");
const fs = require("fs");

const SIZE_THRESHOLD = 100 * 1024 * 1024; // 100 MB
const crypto = require("crypto");

router.post("/download", async (req, res) => {
    const { url, format } = req.body;

    try {
        const info = await getVideoInfo(url);
        const selectedFormat = info.formats.find(f => f.format_id === format) || info.formats[0];
        const originalName = info.title + "." + (selectedFormat.ext || "mp4");

        const token = crypto.randomBytes(6).toString("hex");

        // Store a placeholder immediately
        downloadStore.set(token, { ready: false, originalName });

        // Decide direct vs queue based on size
        const SIZE_THRESHOLD = 100 * 1024 * 1024; // 100 MB
        const size = selectedFormat.filesize || 0;

        if (size && size < SIZE_THRESHOLD) {
            directDownload(url, format, originalName, token);
        } else {
            addToQueue(url, format, originalName, token);
        }

        res.json({
            success: true,
            message: "Download started. The link will become active once processing finishes.",
            downloadUrl: `http://localhost:4000/api/downloads/${token}`,
            token,
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
router.get("/:token", (req, res) => {
    const { token } = req.params;
    const file = downloadStore.get(token);

    if (!file) {
        return res.status(404).json({ success: false, message: "Invalid token" });
    }

    if (!file.ready) {
        return res.status(202).json({ success: false, message: "File not ready yet" });
    }

    const filePath = file.path;
    const fileName = file.originalName || "video.mp4";

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: "File not found" });
    }

    res.download(filePath, fileName);
});


module.exports = router;