const { nanoid } = require("nanoid");
const path = require("path");
const fs = require("fs");
const downloadQueue = require("../../queues/download.queue");
const { downloadStore } = require("../../utils/downloadStore");

// Downloads directory
const downloadsDir = path.join(__dirname, "../../../downloads");

// Ensure downloads folder exists
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

/**
 * Start video download
 */
exports.downloadVideo = async (req, res) => {
  try {
    const { url, format } = req.body || {};

    if (!url || !format) {
      return res.status(400).json({
        success: false,
        message: "url and format required",
      });
    }

    // Determine file extension
    const fileExt = format.includes("audio") ? "mp3" : "mp4";

    const fileName = `${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}.${fileExt}`;

    // Generate secure token
    const token = nanoid(12);

    // Initial placeholder in downloadStore
    downloadStore.set(token, {
      ready: false,
      originalName: fileName,
      path: path.join(downloadsDir, fileName),
      createdAt: Date.now()
    });

    // Add job to queue
    const job = await downloadQueue.add("download-video", {
      url,
      format,
      fileName,
      token,
      originalName: fileName
    });

    const protocol = req.protocol;
    const host = req.get("host");

    const downloadUrl = `${protocol}://${host}/api/downloads/${token}`;

    res.json({
      success: true,
      message:
        "Download started. The link will become active once processing finishes.",
      downloadUrl,
      token,
    });
  } catch (err) {
    console.error("Download start error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * Serve downloaded file using secure token
 */
exports.serveDownload = async (req, res) => {
  try {
    const { token } = req.params;

    if (!downloadTokens.has(token)) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired link",
      });
    }

    const { fileName } = downloadTokens.get(token);
    const filePath = path.join(downloadsDir, fileName);

    // File not ready yet
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not ready yet",
      });
    }

    // Send file to user
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        return;
      }

      console.log(`📥 File downloaded using token: ${token}`);

      // Delete file after download
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Failed to delete file:", err);
        } else {
          console.log(`🗑️ File deleted: ${fileName}`);
        }
      });

      // Remove token so it can't be reused
      downloadTokens.delete(token);
    });
  } catch (err) {
    console.error("Serve download error:", err);

    res.status(500).json({
      success: false,
      message: "Download failed",
    });
  }
}