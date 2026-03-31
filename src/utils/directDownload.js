const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const FFMPEG_PATH = "C:\\ffmpeg-8.0.1-essentials_build\\bin";
const downloadsDir = path.join(__dirname, "../../downloads");

async function directDownload(req, res, url, format, fileName) {
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });
  const finalPath = path.join(downloadsDir, fileName);

  const args = [
    "-f", format + "+bestaudio",
    "--merge-output-format", "mp4",
    "--ffmpeg-location", FFMPEG_PATH,
    "-o", `"${finalPath}"`,
    url
  ];

  const yt = spawn("yt-dlp", args, { shell: true });

  // Cancel on disconnect
  req.on("close", () => {
    console.log("⛔ User disconnected, killing download...");
    yt.kill("SIGKILL");
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
  });

  yt.stdout.on("data", data => process.stdout.write(data.toString()));
  yt.stderr.on("data", data => process.stderr.write(data.toString()));

  yt.on("close", (code) => {
    if (code === 0) {
      console.log(`✅ Direct download complete: ${fileName}`);
      res.download(finalPath, fileName, (err) => {
        if (err) console.error("Error sending file:", err);
      });
    } else {
      console.error("❌ Direct download failed");
      if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
      res.status(500).json({ success: false, message: "Download failed" });
    }
  });
}

module.exports = { directDownload };