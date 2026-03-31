const { spawn } = require("child_process");

function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    const args = ["-J", url]; // JSON metadata
    const yt = spawn("yt-dlp", args, { shell: true });

    let output = "";
    yt.stdout.on("data", (data) => output += data.toString());
    yt.stderr.on("data", (data) => console.error(data.toString()));

    yt.on("close", (code) => {
      if (code !== 0) return reject(new Error("yt-dlp failed to get info"));
      try {
        const info = JSON.parse(output);
        resolve(info);
      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = { getVideoInfo };