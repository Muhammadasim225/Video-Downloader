const { exec } = require("child_process");
const path = require("path");
const { getRandomProxy } = require("../config/proxyManager");

exports.downloadVideo = (url, jobId) => {
  return new Promise((resolve, reject) => {

    const proxy = getRandomProxy();

    if (proxy) {
      console.log(`🌐 Using proxy: ${proxy}`);
    } else {
      console.log("⚠️ No proxy, downloading directly");
    }

    const ytDlpPath = path.join(__dirname, "../../yt-dlp.exe");

    const output = path.join(
      __dirname,
      `../../downloads/${jobId}.%(ext)s`
    );

    const proxyArg = proxy ? `--proxy ${proxy}` : "";
    const command = [`"${ytDlpPath}"`, proxyArg, `-o "${output}"`, url]
      .filter(Boolean)
      .join(" ");

    exec(command, (err, stdout, stderr) => {
      if (err) return reject(stderr);
      resolve(stdout);
    });
  });
};