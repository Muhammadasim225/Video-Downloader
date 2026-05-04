// src/workers/download.worker.js
const { Worker } = require("bullmq");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { downloadStore } = require("../utils/downloadStore");
const connection = require("../config/redis");

const downloadsDir = path.join(__dirname, "../../downloads");
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

function generateTempFileName(fileName) {
  const hash = crypto.randomBytes(4).toString("hex");
  const ext = path.extname(fileName);
  const name = path.basename(fileName, ext);
  return `${name}-${hash}${ext}`;
}

new Worker(
  "download-video",
  async (job) => {
    console.log("📥 JOB RECEIVED:", job.data);
    const { url, format, fileName, token, originalName } = job.data;
    const finalPath = path.join(downloadsDir, fileName);

    // Use temp filename or template
    let tempPath;
    if (format.startsWith("hls-") || format.startsWith("dash-")) {
      const name = path.basename(fileName, path.extname(fileName));
      tempPath = path.join(downloadsDir, `${name}-%(id)s.%(ext)s`); // allow segments
    } else {
      tempPath = path.join(downloadsDir, generateTempFileName(fileName));
    }

    // For video formats that may produce multiple files (HLS/DASH)
    let outputTemplate;
    if (format.startsWith("audio-")) {
      outputTemplate = `"${tempPath}"`;
    } else {
      // Use a template yt-dlp can safely merge
      const ext = path.extname(fileName).slice(1); // "mp4"
      outputTemplate = `"${path.join(downloadsDir, '%(title)s-%(id)s.' + ext)}"`;
    }

    let args = ["--no-playlist", "--newline"];

    if (format.startsWith("audio-")) {
      const audioFormat = format.split("-")[1];

      args.push("-f", "bestaudio"); // ONLY audio stream
      args.push("--extract-audio");
      args.push("--audio-format", audioFormat);

      // ⚠️ IMPORTANT: Use fixed output path (NO template)
      args.push("-o", `"${finalPath}"`);

    } else {
      // Handle HLS/DASH properly
      const fileBaseName = path.parse(fileName).name; // e.g. 1776793025952-3322
      
      if (format.startsWith("hls") || format.includes("HLS")) {
        args.push("-f", `${format}+bestaudio`);
        args.push("-o", `"${path.join(downloadsDir, `${fileBaseName}.%(ext)s`)}"`);

      } else {
        // ✅ ALWAYS combine video + audio
        args.push("-f", `${format}+bestaudio/best`);
        args.push("--merge-output-format", "mp4");

        // ✅ REQUIRED for HLS/DASH (prevents crash)
        args.push("-o", `"${path.join(downloadsDir, `${fileBaseName}.%(ext)s`)}"`);
      }
    }

    args.push(`"${url}"`);

    console.log(`🚀 Download job started: ${fileName}`);
    console.log("yt-dlp args:", args.join(" "));

    return new Promise((resolve, reject) => {
      try {
        const yt = spawn("yt-dlp", args, { shell: true });

        let lastProgress = 0;
        let downloadTimeout;

        function resetTimeout() {
          if (downloadTimeout) clearTimeout(downloadTimeout);
          downloadTimeout = setTimeout(() => {
            yt.kill("SIGKILL");
            reject(new Error("Download stalled or timeout reached"));
          }, 300000);
        }

        yt.stdout.on("data", (data) => {
          const msg = data.toString();
          process.stdout.write(msg);

          const match = msg.match(/\[download\]\s+(\d{1,3}\.\d+)%/);
          if (match) {
            const progress = parseFloat(match[1]);
            if (progress > lastProgress) {
              lastProgress = progress;
              job.updateProgress(progress);
            }
          }

          resetTimeout();
        });

        yt.stderr.on("data", (data) => {
          console.error(data.toString());
          resetTimeout();
        });

        yt.on("close", async (code) => {
          if (downloadTimeout) clearTimeout(downloadTimeout);

          if (code === 0) {
            try {
              // wait a bit (important for Windows file locks)
              await new Promise(res => setTimeout(res, 1000));
              const files = fs.readdirSync(downloadsDir);
              const fileBaseName = path.parse(fileName).name;
              
              // Find the EXACT file yt-dlp just created for this job
              const downloadedFile = files.find(f => 
                  f.startsWith(fileBaseName) && 
                  (f.endsWith(".mp4") || f.endsWith(".webm") || f.endsWith(".mkv") || f.endsWith(".m4a"))
              );

              if (downloadedFile) {
                await safeRename(
                  path.join(downloadsDir, downloadedFile),
                  finalPath
                );
              }

              console.log(`✅ Download complete: ${fileName}`);
              job.updateProgress(100);
              
              if (token) {
                downloadStore.set(token, {
                  ready: true,
                  path: finalPath,
                  originalName: originalName || fileName
                });
              }

              resolve({ success: true, fileName });

            } catch (err) {
              reject(err);
            }
          } else {
            console.error(`❌ Download failed: ${fileName} (exit code ${code})`);
            resolve({ success: false, fileName, error: `yt-dlp exited with code ${code}` });
          }
        });

        // catch unexpected errors
        yt.on("error", (err) => {
          console.error("yt-dlp process error:", err);
          resolve({ success: false, fileName, error: err.message });
        });

      } catch (err) {
        console.error("Worker caught exception:", err);
        resolve({ success: false, fileName, error: err.message });
      }
    });
  },
  { connection, concurrency: 2 }
);

function safeRename(src, dest, retries = 10) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      fs.rename(src, dest, (err) => {
        if (!err) return resolve();

        if (err.code === "EBUSY" && retries > 0) {
          retries--;
          setTimeout(attempt, 500); // wait 0.5 sec and retry
        } else {
          reject(err);
        }
      });
    };

    attempt();
  });
}
async function addToQueue(url, format, fileName) {
  const job = await queue.add("download-video", { url, format, fileName });
  return job;
}

console.log("📥 Download worker started...");
