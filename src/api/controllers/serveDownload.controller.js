const path = require("path");
const fs = require("fs");
const downloadsDir = path.join(__dirname, "../../../downloads");

exports.serveDownload = async (req, res) => {
  try {
    const { token } = req.params;

    if (!downloadTokens.has(token)) {
      return res.status(404).json({ success: false, message: "Invalid or expired link" });
    }

    const { fileName } = downloadTokens.get(token);
    const filePath = path.join(downloadsDir, fileName);

    if (!fs.existsSync(filePath)) {
      downloadTokens.delete(token);
      return res.status(404).json({ success: false, message: "File not ready or deleted" });
    }

    // Stream file to user
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`📥 File downloaded via token: ${token}`);

      // Delete file after download
      fs.unlink(filePath, (err) => {
        if (!err) console.log(`🗑️ File deleted after download: ${fileName}`);
      });

      // Delete token
      downloadTokens.delete(token);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Download failed" });
  }
};