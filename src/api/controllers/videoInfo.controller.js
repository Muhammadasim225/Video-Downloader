// src/api/controllers/videoInfo.controller.js
const { spawn } = require("child_process");

exports.getVideoInfo = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Video URL is required",
      });
    }

    const yt = spawn("yt-dlp", ["--dump-json", "--no-playlist", url]);

    let data = "";

    yt.stdout.on("data", chunk => {
      data += chunk.toString();
    });

    yt.stderr.on("data", err => {
      console.error("yt-dlp error:", err.toString());
    });

    yt.on("close", () => {
      try {
        const json = JSON.parse(data);

        const formats = (json.formats || [])
          .filter(f => f.ext)
          .map(f => {
            let type = "unknown";
            if (f.vcodec !== "none" && f.acodec !== "none") type = "video+audio";
            else if (f.vcodec !== "none") type = "video";
            else if (f.acodec !== "none") type = "audio";

            // Make video labels consistent
            let label;
            if (type === "video" || type === "video+audio") {
              label = f.height ? `${f.height}p` : f.format_note || "video";
            } else {
              label = f.format_note || "audio";
            }

            return {
              label,
              format: f.format_id,
              type,
              ext: f.ext,
              filesize: f.filesize || null,
              vcodec: f.vcodec || null,
              acodec: f.acodec || null,
            };
          });

        // Add synthetic audio options
        const hasAudio = formats.some(f => f.type === "audio" || f.type === "video+audio");
        const syntheticAudio = hasAudio
          ? [
              { label: "Audio MP3", format: "audio-mp3", type: "audio", ext: "mp3", filesize: null },
              { label: "Audio M4A", format: "audio-m4a", type: "audio", ext: "m4a", filesize: null },
            ]
          : [];

        res.json({
          success: true,
          title: json.title,
          duration: json.duration,
          thumbnail: json.thumbnail,
          formats: [...formats, ...syntheticAudio],
        });

      } catch (e) {
        console.error(e);
        return res.status(500).json({
          success: false,
          message: "Failed to parse video info",
        });
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};