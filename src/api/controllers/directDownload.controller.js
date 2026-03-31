const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

exports.directDownload = async (req, res) => {
  try {
    const { url, format } = req.body;

    if (!url || !format) {
      return res.status(400).json({ success: false, message: "url and format required" });
    }

    const fileName = `${Date.now()}.mp4`;
    const filePath = path.join(__dirname, "../../../downloads", fileName);

    let args = ["--no-playlist", "--newline"];

    if (format.startsWith("audio-")) {
      args.push("-f", "bestaudio");
      args.push("--extract-audio", "--audio-format", format.split("-")[1]);
    } else {
      args.push("-f", `${format}+bestaudio/best`);
      args.push("--merge-output-format", "mp4");
    }

    args.push("-o", `"${filePath}"`);
    args.push(url);

    console.log("🚀 Starting direct download...");

    const yt = spawn("yt-dlp", args, { shell: true });

    // ❗ Detect if user closes browser
    req.on("close", () => {
      console.log("❌ User disconnected. Cancelling download...");

      yt.kill("SIGKILL");

      // delete partial file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("🗑️ Partial file deleted");
      }
    });

    yt.on("close", (code) => {
      if (code === 0 && fs.existsSync(filePath)) {
        console.log("✅ Download complete, sending file");

        res.download(filePath, "video.mp4", (err) => {
          if (err) console.error(err);

          // cleanup after sending
          fs.unlink(filePath, () => {});
        });

      } else {
        console.log("❌ Download failed");
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: "Download failed" });
        }
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};